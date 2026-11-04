"use server";

import { requireAdmin } from "@/lib/auth";
import { checkInAndRefundDeposit, getCheckInPreview } from "@/lib/db";
import { verifyTicketToken } from "@/lib/ticket-token";
import { centsToCny } from "@/lib/money";

export type CheckInState = {
  error?: string;
  preview?: {
    token: string;
    ticketCode: string;
    buyerName: string;
    phone: string;
    showTitle: string;
    quantity: number;
    depositCents: number;
    depositLabel: string;
    alreadyCheckedIn: boolean;
    alreadyRefunded: boolean;
  };
  result?: {
    ticketCode: string;
    buyerName: string;
    depositLabel: string;
    orderStatus: string;
  };
};

function resolveTicketCode(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const fromToken = verifyTicketToken(value);
  if (fromToken) return fromToken;
  if (value.startsWith("T-")) return value.toUpperCase();
  return null;
}

export async function previewCheckInAction(
  _prev: CheckInState,
  formData: FormData
): Promise<CheckInState> {
  try {
    await requireAdmin();
    const raw = String(formData.get("token") || "");
    const ticketCode = resolveTicketCode(raw);
    if (!ticketCode) return { error: "无效票券二维码或票号。" };
    const preview = getCheckInPreview(ticketCode);
    return {
      preview: {
        token: raw.trim(),
        ticketCode: preview.ticket.code,
        buyerName: preview.order.buyerName,
        phone: preview.order.phone,
        showTitle: preview.show.title,
        quantity: preview.order.quantity,
        depositCents: preview.depositPerTicketCents,
        depositLabel: centsToCny(preview.depositPerTicketCents),
        alreadyCheckedIn: Boolean(preview.ticket.checkedInAt),
        alreadyRefunded: Boolean(preview.ticket.depositRefundedAt),
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "UNAUTHORIZED") return { error: "请重新登录。" };
    if (msg === "TICKET_NOT_FOUND") return { error: "找不到该票。" };
    return { error: "查询失败。" };
  }
}

export async function confirmCheckInAction(
  _prev: CheckInState,
  formData: FormData
): Promise<CheckInState> {
  try {
    await requireAdmin();
    const raw = String(formData.get("token") || "");
    const ticketCode = resolveTicketCode(raw);
    if (!ticketCode) return { error: "无效票券。" };
    const refundedBy = String(formData.get("refundedBy") || "door-staff");
    const result = checkInAndRefundDeposit(ticketCode, refundedBy);
    return {
      result: {
        ticketCode: result.ticket.code,
        buyerName: result.order.buyerName,
        depositLabel: centsToCny(result.show.depositCents),
        orderStatus: result.order.status,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "UNAUTHORIZED") return { error: "请重新登录。" };
    if (msg === "TICKET_NOT_FOUND") return { error: "找不到该票。" };
    if (msg === "ORDER_NOT_ISSUED") return { error: "订单尚未出票。" };
    return { error: "核销失败。" };
  }
}
