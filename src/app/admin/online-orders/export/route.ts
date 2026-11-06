import { NextResponse } from "next/server";
import { ID_DOC_TYPE_LABEL, isIdDocType } from "@/lib/attendees";
import { formatShowTime } from "@/lib/format";
import { phoneTail } from "@/lib/phone";
import {
  createSupabaseServerClient,
  getSupabaseUser,
} from "@/lib/supabase/server";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type OnlineOrder = {
  id: number;
  show_id: number;
  phone: string;
  quantity: number;
  status: OrderStatus;
  admin_note: string;
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

function csvCell(value: string | number): string {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
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
    .select("id, show_id, phone, quantity, status, admin_note, created_at")
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
  const purchaseNumbers = purchaseNumbersByShow(orders);

  const filtered =
    showId && Number.isFinite(showId)
      ? orders.filter((order) => order.show_id === showId)
      : orders;

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

  const sortedOrders = filtered.slice().sort((a, b) => {
    if (a.show_id !== b.show_id) {
      const aShow = showsById.get(a.show_id)?.starts_at || "";
      const bShow = showsById.get(b.show_id)?.starts_at || "";
      return aShow.localeCompare(bShow);
    }
    return (purchaseNumbers.get(a.id) || 0) - (purchaseNumbers.get(b.id) || 0);
  });

  const rows: Array<Array<string | number>> = [];
  for (const order of sortedOrders) {
    const show = showsById.get(order.show_id);
    const attendees = attendeesByOrder.get(order.id) || [];
    const base = [
      purchaseNumbers.get(order.id) || "",
      show ? formatShowTime(show.starts_at) : "",
      show?.title || "",
      phoneTail(order.phone),
      order.phone,
      order.quantity,
      ORDER_STATUS_LABEL[order.status] || order.status,
      order.admin_note || "",
    ];
    if (attendees.length === 0) {
      rows.push([...base, "", "", "", "", ""]);
      continue;
    }
    for (const attendee of attendees) {
      rows.push([
        ...base,
        attendee.sort_index,
        attendee.full_name,
        attendee.phone,
        isIdDocType(attendee.id_doc_type)
          ? ID_DOC_TYPE_LABEL[attendee.id_doc_type]
          : attendee.id_doc_type,
        attendee.id_number,
      ]);
    }
  }

  const header = [
    "购票编号",
    "场次时间",
    "场次",
    "订单手机尾号",
    "订单手机",
    "张数",
    "状态",
    "备注",
    "观众序号",
    "观众姓名",
    "观众电话",
    "证件类型",
    "证件号",
  ];

  const csv = `\uFEFF${[header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n")}\r\n`;

  const stamp = new Date().toISOString().slice(0, 10);
  const showSuffix =
    showId && Number.isFinite(showId) ? `-show-${showId}` : "";
  const filename = `orders${showSuffix}-${stamp}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
