import { NextResponse } from "next/server";
import { ID_DOC_TYPE_LABEL, isIdDocType } from "@/lib/attendees";
import { formatShowTime } from "@/lib/format";
import {
  createSupabaseServerClient,
  getSupabaseUser,
} from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type OnlineOrder = {
  id: number;
  show_id: number;
  phone: string;
  quantity: number;
  status: OrderStatus;
  created_at: string;
};

type OnlineShow = {
  id: number;
  title: string;
  starts_at: string;
  venue: string;
};

type AttendeeRow = {
  order_id: number;
  sort_index: number;
  full_name: string;
  phone: string;
  id_doc_type: string;
  id_number: string;
};

const HEADER = [
  "购票编号",
  "张数",
  "观众姓名",
  "观众电话",
  "证件类型",
  "证件号",
  "学号",
] as const;

function xmlEscape(value: string | number): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sheetNameForShow(show: OnlineShow | undefined, showId: number): string {
  if (!show) return `场次${showId}`.slice(0, 31);
  const d = new Date(show.starts_at);
  const dateLabel = Number.isNaN(d.getTime())
    ? show.title
    : new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Hong_Kong",
        month: "numeric",
        day: "numeric",
        weekday: "short",
      }).format(d);
  const raw = `${dateLabel} ${show.title}`.trim() || formatShowTime(show.starts_at);
  const cleaned = raw.replace(/[\\/*?:\[\]]/g, " ").replace(/\s+/g, " ").trim();
  return (cleaned || `场次${showId}`).slice(0, 31);
}

/** 手机/证件号等长数字：用公式写入，避免 Excel 显示前导撇号，且不丢精度。 */
function digitTextCellXml(value: string): string {
  const text = String(value ?? "").replace(/^'+/, "");
  const escaped = xmlEscape(text);
  return `<Cell ss:Formula="=&quot;${escaped}&quot;"><Data ss:Type="String">${escaped}</Data></Cell>`;
}

function cellXml(value: string | number): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
}

/** 列：购票编号, 张数, 观众姓名, 观众电话, 证件类型, 证件号, 学号 */
const DIGIT_TEXT_COLUMNS = new Set([3, 5, 6]);

function dataRowXml(cells: Array<string | number>): string {
  const xml = cells
    .map((value, index) => {
      if (DIGIT_TEXT_COLUMNS.has(index)) {
        return digitTextCellXml(String(value ?? ""));
      }
      return cellXml(value);
    })
    .join("");
  return `<Row>${xml}</Row>`;
}

function headerRowXml(): string {
  return `<Row>${HEADER.map((title) => cellXml(title)).join("")}</Row>`;
}

function worksheetXml(
  name: string,
  rows: Array<Array<string | number>>,
): string {
  const safeName = xmlEscape(name.slice(0, 31) || "Sheet");
  const tableRows = [headerRowXml(), ...rows.map(dataRowXml)].join("");
  return `<Worksheet ss:Name="${safeName}"><Table>${tableRows}</Table></Worksheet>`;
}

function buildWorkbookXml(
  sheets: Array<{ name: string; rows: Array<Array<string | number>> }>,
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal"/>
  <Style ss:ID="Text"><NumberFormat ss:Format="@"/></Style>
 </Styles>
${sheets.map((sheet) => worksheetXml(sheet.name, sheet.rows)).join("\n")}
</Workbook>
`;
}

function purchaseNumbersByShow(orders: OnlineOrder[]): Map<number, number> {
  const byShow = new Map<number, OnlineOrder[]>();
  for (const order of orders) {
    const list = byShow.get(order.show_id) || [];
    list.push(order);
    byShow.set(order.show_id, list);
  }
  const numbers = new Map<number, number>();
  for (const list of byShow.values()) {
    list
      .slice()
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime() ||
          a.id - b.id,
      )
      .forEach((order, index) => {
        numbers.set(order.id, index + 1);
      });
  }
  return numbers;
}

function rowsForOrders(
  orders: OnlineOrder[],
  attendeesByOrder: Map<number, AttendeeRow[]>,
  purchaseNumbers: Map<number, number>,
): Array<Array<string | number>> {
  const sorted = orders
    .slice()
    .sort(
      (a, b) =>
        (purchaseNumbers.get(a.id) || 0) - (purchaseNumbers.get(b.id) || 0),
    );
  const rows: Array<Array<string | number>> = [];
  for (const order of sorted) {
    const attendees = attendeesByOrder.get(order.id) || [];
    const base: Array<string | number> = [
      purchaseNumbers.get(order.id) || "",
      order.quantity,
    ];
    if (attendees.length === 0) {
      rows.push([...base, "", "", "", "", ""]);
      continue;
    }
    for (const attendee of attendees) {
      const isStudentId = attendee.id_doc_type === "student_id";
      const docTypeLabel = isStudentId
        ? ""
        : isIdDocType(attendee.id_doc_type)
          ? ID_DOC_TYPE_LABEL[attendee.id_doc_type]
          : attendee.id_doc_type;
      rows.push([
        ...base,
        attendee.full_name,
        attendee.phone,
        docTypeLabel,
        isStudentId ? "" : attendee.id_number,
        isStudentId ? attendee.id_number : "",
      ]);
    }
  }
  return rows;
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const user = await getSupabaseUser(supabase);
  if (!user) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  const url = new URL(request.url);
  const showIdRaw = url.searchParams.get("showId");
  const showId = showIdRaw ? Number(showIdRaw) : null;

  const { data: orderData, error: ordersError } = await supabase
    .from("orders")
    .select("id, show_id, phone, quantity, status, created_at")
    .order("created_at", { ascending: true });
  if (ordersError) {
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }

  const orders = (orderData || []) as OnlineOrder[];
  const { data: showData, error: showsError } = await supabase
    .from("shows")
    .select("id, title, starts_at, venue")
    .order("starts_at");
  if (showsError) {
    return NextResponse.json({ error: "show_lookup_failed" }, { status: 500 });
  }
  const shows = (showData || []) as OnlineShow[];
  const showsById = new Map(shows.map((show) => [show.id, show]));
  // 购票编号仍按全量订单顺序计算，与后台一致；名单只导出已出票。
  const purchaseNumbers = purchaseNumbersByShow(orders);
  const issuedOrders = orders.filter((order) => order.status === "issued");

  const filtered =
    showId && Number.isFinite(showId)
      ? issuedOrders.filter((order) => order.show_id === showId)
      : issuedOrders;

  const orderIds = filtered.map((order) => order.id);
  const attendeesByOrder = new Map<number, AttendeeRow[]>();
  if (orderIds.length > 0) {
    const { data: attendeeData, error: attendeeError } = await supabase
      .from("order_attendees")
      .select("order_id, sort_index, full_name, phone, id_doc_type, id_number")
      .in("order_id", orderIds)
      .order("sort_index");
    if (attendeeError) {
      return NextResponse.json({ error: "attendee_lookup_failed" }, { status: 500 });
    }
    for (const row of (attendeeData || []) as AttendeeRow[]) {
      const list = attendeesByOrder.get(row.order_id) || [];
      list.push(row);
      attendeesByOrder.set(row.order_id, list);
    }
  }

  const showIdsInExport =
    showId && Number.isFinite(showId)
      ? [showId]
      : shows
          .map((show) => show.id)
          .filter((id) => filtered.some((order) => order.show_id === id));

  // Include shows that have orders even if missing from shows list.
  for (const order of filtered) {
    if (!showIdsInExport.includes(order.show_id)) {
      showIdsInExport.push(order.show_id);
    }
  }

  const sheets = showIdsInExport.map((id) => {
    const show = showsById.get(id);
    const showOrders = filtered.filter((order) => order.show_id === id);
    return {
      name: sheetNameForShow(show, id),
      rows: rowsForOrders(showOrders, attendeesByOrder, purchaseNumbers),
    };
  });

  // Fallback empty sheet if somehow no shows.
  if (sheets.length === 0) {
    sheets.push({ name: "名单", rows: [] });
  }

  const xml = buildWorkbookXml(sheets);
  const stamp = new Date().toISOString().slice(0, 10);
  const showSuffix =
    showId && Number.isFinite(showId) ? `-show-${showId}` : "";
  const filename = `orders${showSuffix}-${stamp}.xls`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
