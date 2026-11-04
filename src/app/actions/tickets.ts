"use server";

import { getTicketsForOrder, lookupOrdersByContact } from "@/lib/db";
import { centsToCny } from "@/lib/money";
import { toDataUrl } from "@/lib/qr";
import { signTicketCode } from "@/lib/ticket-token";
import { ORDER_STATUS_LABEL } from "@/lib/types";

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

  const orders = lookupOrdersByContact(buyerName, contact);
  if (orders.length === 0) {
    return { error: "未找到符合資料的訂單，請確認姓名及完整手機號碼或電郵地址。" };
  }

  return {
    orders: await Promise.all(
      orders.map(async (order) => {
        const tickets = await Promise.all(
          getTicketsForOrder(order.id).map(async (ticket) => ({
            code: ticket.code,
            status: ticket.depositRefundedAt
              ? "按金已退"
              : ticket.checkedInAt
                ? "已核銷"
                : "待核銷",
            dataUrl: await toDataUrl(signTicketCode(ticket.code)),
          }))
        );

        return {
          id: order.id,
          code: order.code,
          status: ORDER_STATUS_LABEL[order.status],
          showTitle: order.showTitle,
          showStartsAt: order.showStartsAt,
          showVenue: order.showVenue,
          quantity: order.quantity,
          total: centsToCny(order.ticketTotalCents + order.depositTotalCents),
          tickets,
        };
      })
    ),
  };
}
