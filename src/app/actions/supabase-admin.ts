"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  getSupabaseUser,
} from "@/lib/supabase/server";
import { sendTicketIssuedEmail } from "@/lib/ticket-email";

async function requireSupabaseAdmin() {
  const supabase = await createSupabaseServerClient();
  const user = await getSupabaseUser(supabase);
  if (!user) redirect("/account");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error("ADMIN_LOOKUP_FAILED");
  if (profile?.role !== "admin") redirect("/account");
  return supabase;
}

export async function confirmSupabaseOrderAction(formData: FormData) {
  const supabase = await requireSupabaseAdmin();
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const { error } = await supabase.rpc("confirm_ticket_order", {
    p_order_code: code,
  });
  if (error) {
    redirect("/admin/online-orders?error=confirm");
  }
  await deliverTicketEmail(supabase, code);
  revalidatePath("/admin/online-orders");
  revalidatePath(`/orders/${code}`);
  revalidatePath("/tickets");
  redirect("/admin/online-orders?done=confirm");
}

export async function sendTicketEmailAction(formData: FormData) {
  const supabase = await requireSupabaseAdmin();
  const code = String(formData.get("code") || "").trim().toUpperCase();
  await deliverTicketEmail(supabase, code);
  revalidatePath("/admin/online-orders");
  revalidatePath(`/orders/${code}`);
  redirect("/admin/online-orders?done=email");
}

async function deliverTicketEmail(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  code: string
) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("buyer_name, contact_extra, status")
    .eq("code", code)
    .maybeSingle();
  if (orderError || !order) redirect("/admin/online-orders?error=email");
  if (!["issued", "checked_in", "deposit_refunded"].includes(order.status)) {
    redirect("/admin/online-orders?error=email");
  }
  if (!order.contact_extra) redirect("/admin/online-orders?error=email");

  try {
    await sendTicketIssuedEmail({
      to: order.contact_extra,
      buyerName: order.buyer_name,
      orderCode: code,
    });
  } catch {
    redirect("/admin/online-orders?error=email");
  }

  const { error: markError } = await supabase.rpc("mark_ticket_email_sent", {
    p_order_code: code,
  });
  if (markError) redirect("/admin/online-orders?error=email");
}

export async function closeSupabaseOrderAction(formData: FormData) {
  const supabase = await requireSupabaseAdmin();
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const status = String(formData.get("status") || "");
  const note = String(formData.get("reason") || "").trim();
  if (status !== "cancelled" && status !== "expired") {
    redirect("/admin/online-orders?error=close");
  }

  const { error } = await supabase.rpc("close_ticket_order", {
    p_order_code: code,
    p_status: status,
    p_admin_note: note,
  });
  if (error) redirect("/admin/online-orders?error=close");
  revalidatePath("/admin/online-orders");
  revalidatePath(`/orders/${code}`);
  redirect("/admin/online-orders?done=close");
}
