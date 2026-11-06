"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { centsToCny } from "@/lib/money";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";
import { listSupabaseOrdersForCurrentUser } from "@/lib/supabase/orders";
import { loadPurchaseNumbersForShows } from "@/lib/supabase/purchase-numbers";

type GuestTicketLookupRow = {
  id: number;
  code: string;
  status: OrderStatus;
  show_title: string;
  show_starts_at: string;
  show_venue: string;
  quantity: number;
  ticket_total_cents: number;
  deposit_total_cents: number;
  tickets: Array<{
    code: string;
    checked_in_at: string | null;
    deposit_refunded_at: string | null;
  }>;
};

export type TicketLookupState = {
  error?: string;
  orders?: Array<{
    id: number;
    code: string;
    statusKey: OrderStatus;
    status: string;
    showTitle: string;
    showStartsAt: string;
    showVenue: string;
    quantity: number;
    total: string;
    phone: string;
    purchaseNo: number | null;
    tickets: Array<{
      code: string;
      status: string;
    }>;
  }>;
};

function mapIssuedTickets(
  status: OrderStatus,
  tickets: Array<{
    code: string;
    checked_in_at?: string | null;
    deposit_refunded_at?: string | null;
    checkedInAt?: string | null;
    depositRefundedAt?: string | null;
  }>,
) {
  const issued =
    status === "issued" || status === "checked_in" || status === "deposit_refunded";
  if (!issued) return [];
  return tickets.map((ticket) => {
    const refunded = ticket.deposit_refunded_at || ticket.depositRefundedAt;
    const checked = ticket.checked_in_at || ticket.checkedInAt;
    return {
      code: ticket.code,
      status: refunded ? "按金已退" : checked ? "已核销" : "待核销",
    };
  });
}

export async function lookupTicketsAction(
  _previousState: TicketLookupState,
  formData: FormData
): Promise<TicketLookupState> {
  const buyerName = String(formData.get("buyerName") || "").trim();
  const contact = String(formData.get("contact") || "").trim();
  if (!buyerName || !contact) {
    return { error: "請填寫購票姓名，以及下單時使用的手機號碼或電郵。" };
  }

  const phoneDigits = contact.replace(/\D/g, "");
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  if (phoneDigits.length < 7 && !looksLikeEmail) {
    return { error: "請輸入有效的手機號碼或電郵地址。" };
  }

  const accountOrders = await listSupabaseOrdersForCurrentUser();
  if (accountOrders.length > 0) {
    const purchaseNumbers = await loadPurchaseNumbersForShows(
      accountOrders.map(({ order }) => order.showId),
    );
    return {
      orders: accountOrders.map(({ order, tickets }) => {
        const issuedTickets = mapIssuedTickets(order.status, tickets);
        return {
          id: order.id,
          code: order.code,
          statusKey: order.status,
          status: ORDER_STATUS_LABEL[order.status],
          showTitle: order.showTitle,
          showStartsAt: order.showStartsAt,
          showVenue: order.showVenue,
          quantity: order.quantity,
          total: centsToCny(order.ticketTotalCents + order.depositTotalCents),
          phone: order.phone,
          purchaseNo:
            issuedTickets.length > 0 ? purchaseNumbers.get(order.id) || null : null,
          tickets: issuedTickets,
        };
      }),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("lookup_ticket_orders", {
    p_buyer_name: buyerName,
    p_contact: contact,
  });
  if (error) {
    if (error.code === "PGRST202") {
      return { error: "线上找票功能尚未启用，请先完成 Supabase 数据库迁移。" };
    }
    throw new Error("SUPABASE_TICKET_LOOKUP_FAILED");
  }

  const orders = (data || []) as GuestTicketLookupRow[];
  if (orders.length === 0) {
    return { error: "未找到符合資料的訂單，請確認姓名及完整手機號碼或電郵地址。" };
  }

  const { data: infoRows } = await supabase.rpc("get_orders_purchase_info", {
    p_order_ids: orders.map((order) => order.id),
  });
  const infoById = new Map(
    ((infoRows || []) as Array<{
      order_id: number;
      phone: string;
      purchase_no: number;
    }>).map((row) => [Number(row.order_id), row]),
  );

  return {
    orders: orders.map((order) => {
      const issuedTickets = mapIssuedTickets(order.status, order.tickets);
      const info = infoById.get(order.id);
      return {
        id: order.id,
        code: order.code,
        statusKey: order.status,
        status: ORDER_STATUS_LABEL[order.status],
        showTitle: order.show_title,
        showStartsAt: order.show_starts_at,
        showVenue: order.show_venue,
        quantity: order.quantity,
        total: centsToCny(order.ticket_total_cents + order.deposit_total_cents),
        phone: info?.phone || (looksLikeEmail ? "" : contact),
        purchaseNo:
          issuedTickets.length > 0 ? Number(info?.purchase_no) || null : null,
        tickets: issuedTickets,
      };
    }),
  };
}
