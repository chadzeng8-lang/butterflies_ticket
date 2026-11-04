import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getTicketsForOrder, listOrders } from "@/lib/db";

function csvEscape(value: string | number) {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const url = new URL(req.url);
  const showId = Number(url.searchParams.get("showId"));
  const kind = url.searchParams.get("kind") || "all";
  if (!showId) {
    return new NextResponse("Missing showId", { status: 400 });
  }

  let orders = listOrders({ showId });
  orders = orders.filter((o) =>
    ["pending_confirm", "issued", "checked_in", "deposit_refunded"].includes(o.status)
  );

  if (kind === "unchecked") {
    orders = orders.filter((o) => o.status === "issued");
  }
  if (kind === "deposit") {
    orders = orders.filter(
      (o) => o.status === "issued" || o.status === "checked_in"
    );
  }

  const header = [
    "order_code",
    "status",
    "buyer_name",
    "phone",
    "contact",
    "quantity",
    "ticket_cny",
    "deposit_cny",
    "total_cny",
    "ticket_codes",
    "checked_in",
    "deposit_refunded",
  ];

  const lines = [header.join(",")];
  for (const order of orders) {
    const tickets = getTicketsForOrder(order.id);
    lines.push(
      [
        order.code,
        order.status,
        order.buyerName,
        order.phone,
        order.contactExtra,
        order.quantity,
        (order.ticketTotalCents / 100).toFixed(2),
        (order.depositTotalCents / 100).toFixed(2),
        ((order.ticketTotalCents + order.depositTotalCents) / 100).toFixed(2),
        tickets.map((t) => t.code).join("|"),
        tickets.every((t) => t.checkedInAt) ? "yes" : "no",
        tickets.every((t) => t.depositRefundedAt) ? "yes" : "no",
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  const body = "\uFEFF" + lines.join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="show-${showId}-${kind}.csv"`,
    },
  });
}
