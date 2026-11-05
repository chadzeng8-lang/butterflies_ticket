"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { centsToCny } from "@/lib/money";
import { toDataUrl } from "@/lib/qr";
import { signTicketCode } from "@/lib/ticket-token";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";
import { listSupabaseOrdersForCurrentUser } from "@/lib/supabase/orders";

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
    status: string;
    showTitle: string;
    showStartsAt: string;
    showVenue: string;
    quantity: number;
    total: string;
    tickets: Array<{
      code: string;
      status: string;
      dataUrl: string;
    }>;
  }>;
};

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
    return {
      orders: await Promise.all(
        accountOrders.map(async ({ order, tickets }) => ({
          id: order.id,
          code: order.code,
          status: ORDER_STATUS_LABEL[order.status],
          showTitle: order.showTitle,
          showStartsAt: order.showStartsAt,
          showVenue: order.showVenue,
          quantity: order.quantity,
          total: centsToCny(order.ticketTotalCents + order.depositTotalCents),
          tickets: await Promise.all(
            tickets.map(async (ticket) => ({
              code: ticket.code,
              status: ticket.depositRefundedAt
                ? "按金已退"
                : ticket.checkedInAt
                  ? "已核销"
                  : "待核销",
              dataUrl: await toDataUrl(signTicketCode(ticket.code)),
            }))
          ),
        }))
      ),
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

  return {
    orders: await Promise.all(
      orders.map(async (order) => ({
        id: order.id,
        code: order.code,
        status: ORDER_STATUS_LABEL[order.status],
        showTitle: order.show_title,
        showStartsAt: order.show_starts_at,
        showVenue: order.show_venue,
        quantity: order.quantity,
        total: centsToCny(order.ticket_total_cents + order.deposit_total_cents),
        tickets: await Promise.all(
          order.tickets.map(async (ticket) => ({
            code: ticket.code,
            status: ticket.deposit_refunded_at
              ? "按金已退"
              : ticket.checked_in_at
                ? "已核销"
                : "待核销",
            dataUrl: await toDataUrl(signTicketCode(ticket.code)),
          }))
        ),
      }))
    ),
  };
}
