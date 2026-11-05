"use server";

import { z } from "zod";
import { createSupabaseServerClient, getSupabaseUser } from "@/lib/supabase/server";
import { verifyTicketToken } from "@/lib/ticket-token";

const ticketInputSchema = z.string().trim().min(1).max(2048);

export type OnlineCheckInState = {
  error?: string;
  preview?: {
    token: string;
    ticketCode: string;
    buyerName: string;
    phone: string;
    showTitle: string;
    quantity: number;
    depositCents: number;
    alreadyCheckedIn: boolean;
    alreadyRefunded: boolean;
  };
  result?: {
    ticketCode: string;
    buyerName: string;
    depositCents: number;
    alreadyCheckedIn: boolean;
    alreadyRefunded: boolean;
    orderStatus: string;
  };
};

function resolveTicketCode(rawValue: FormDataEntryValue | null): {
  raw: string;
  code: string;
} | null {
  const parsed = ticketInputSchema.safeParse(rawValue);
  if (!parsed.success) return null;
  const raw = parsed.data;
  const code = verifyTicketToken(raw) || (raw.startsWith("T-") ? raw.toUpperCase() : "");
  return code ? { raw, code } : null;
}

async function requireOnlineAdmin() {
  const supabase = await createSupabaseServerClient();
  const user = await getSupabaseUser(supabase);
  if (!user) return { error: "请先登录管理员账号。", supabase: null, user: null };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error("ADMIN_LOOKUP_FAILED");
  if (profile?.role !== "admin") {
    return { error: "当前账号没有管理员权限。", supabase: null, user: null };
  }
  return { error: "", supabase, user };
}

export async function previewOnlineCheckInAction(
  _previous: OnlineCheckInState,
  formData: FormData
): Promise<OnlineCheckInState> {
  const auth = await requireOnlineAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error };

  const resolved = resolveTicketCode(formData.get("token"));
  if (!resolved) return { error: "无效二维码或票号，请扫描电子票二维码。" };

  const { data: ticket, error: ticketError } = await auth.supabase
    .from("tickets")
    .select("id, code, order_id, checked_in_at, deposit_refunded_at")
    .eq("code", resolved.code)
    .maybeSingle();
  if (ticketError) throw new Error("ONLINE_TICKET_LOOKUP_FAILED");
  if (!ticket) return { error: "找不到这张在线票，请确认使用的是 Supabase 订单电子票。" };

  const { data: order, error: orderError } = await auth.supabase
    .from("orders")
    .select("buyer_name, phone, quantity, show_id, status")
    .eq("id", ticket.order_id)
    .maybeSingle();
  if (orderError) throw new Error("ONLINE_ORDER_LOOKUP_FAILED");
  if (!order || !["issued", "checked_in", "deposit_refunded"].includes(order.status)) {
    return { error: "该订单尚未出票，暂不能核销。" };
  }

  const { data: show, error: showError } = await auth.supabase
    .from("shows")
    .select("title, deposit_cents")
    .eq("id", order.show_id)
    .maybeSingle();
  if (showError) throw new Error("ONLINE_SHOW_LOOKUP_FAILED");
  if (!show) throw new Error("ONLINE_SHOW_MISSING");

  return {
    preview: {
      token: resolved.code,
      ticketCode: ticket.code,
      buyerName: order.buyer_name,
      phone: order.phone,
      showTitle: show.title,
      quantity: order.quantity,
      depositCents: show.deposit_cents,
      alreadyCheckedIn: Boolean(ticket.checked_in_at),
      alreadyRefunded: Boolean(ticket.deposit_refunded_at),
    },
  };
}

export async function confirmOnlineCheckInAction(
  _previous: OnlineCheckInState,
  formData: FormData
): Promise<OnlineCheckInState> {
  const auth = await requireOnlineAdmin();
  if (auth.error || !auth.supabase) return { error: auth.error };

  const resolved = resolveTicketCode(formData.get("token"));
  if (!resolved) return { error: "无效二维码或票号，请重新查询。" };
  const { data, error } = await auth.supabase.rpc("checkin_ticket", {
    p_ticket_code: resolved.code,
    p_refunded_by: auth.user?.email || auth.user?.id || "",
  });
  if (error) {
    if (error.message.includes("TICKET_NOT_FOUND")) return { error: "找不到这张在线票。" };
    if (error.message.includes("ORDER_NOT_ISSUED")) return { error: "该订单尚未出票，暂不能核销。" };
    if (error.message.includes("ADMIN_REQUIRED")) return { error: "当前账号没有管理员权限。" };
    throw new Error("ONLINE_CHECKIN_FAILED");
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.ticket_code) throw new Error("ONLINE_CHECKIN_RESULT_MISSING");
  return {
    result: {
      ticketCode: result.ticket_code,
      buyerName: result.buyer_name,
      depositCents: result.deposit_cents,
      alreadyCheckedIn: result.already_checked_in,
      alreadyRefunded: result.already_refunded,
      orderStatus: result.order_status,
    },
  };
}
