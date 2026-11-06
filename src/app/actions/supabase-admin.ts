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
  if (orderError) redirect("/admin/online-orders?error=email_order_lookup");
  if (!order) redirect("/admin/online-orders?error=email_order_missing");
  if (!["issued", "checked_in", "deposit_refunded"].includes(order.status)) {
    redirect("/admin/online-orders?error=email_order_status");
  }
  if (!order.contact_extra) {
    redirect("/admin/online-orders?error=email_recipient_missing");
  }

  try {
    await sendTicketIssuedEmail({
      to: order.contact_extra,
      buyerName: order.buyer_name,
      orderCode: code,
    });
  } catch (error) {
    const code =
      error instanceof Error && error.message.startsWith("EMAIL_")
        ? error.message
        : "EMAIL_PROVIDER_REJECTED";
    redirect(`/admin/online-orders?error=${encodeURIComponent(code)}`);
  }

  const { error: markError } = await supabase.rpc("mark_ticket_email_sent", {
    p_order_code: code,
  });
  if (markError) redirect("/admin/online-orders?error=email_tracking");
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

export async function updateShowInventoryAction(formData: FormData) {
  const supabase = await requireSupabaseAdmin();
  const showId = Number.parseInt(String(formData.get("showId") || ""), 10);
  const capacity = Number.parseInt(String(formData.get("capacity") || ""), 10);

  const nextPath = String(formData.get("next") || "").trim();
  const returnTo =
    nextPath === "/admin/online-orders" || nextPath === "/admin/online-inventory"
      ? nextPath
      : "/admin/online-inventory";

  if (!Number.isInteger(showId) || showId < 1) {
    redirect(`${returnTo}?error=invalid`);
  }
  if (!Number.isInteger(capacity) || capacity < 1) {
    redirect(`${returnTo}?error=capacity`);
  }

  const activeStatuses = [
    "pending_payment",
    "pending_confirm",
    "issued",
    "checked_in",
    "deposit_refunded",
  ];
  const { data: heldRows, error: heldError } = await supabase
    .from("orders")
    .select("quantity")
    .eq("show_id", showId)
    .in("status", activeStatuses);
  if (heldError) redirect(`${returnTo}?error=lookup`);

  const heldSeats = (heldRows || []).reduce(
    (sum, row) => sum + Number(row.quantity || 0),
    0,
  );
  if (capacity < heldSeats) {
    redirect(`${returnTo}?error=public_negative`);
  }

  const { error } = await supabase
    .from("shows")
    .update({
      capacity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", showId);
  if (error) redirect(`${returnTo}?error=save`);

  revalidatePath("/admin/online-inventory");
  revalidatePath("/admin/online-orders");
  revalidatePath("/shows");
  revalidatePath("/");
  redirect(`${returnTo}?done=save`);
}

function orderEditErrorCode(message: string | undefined): string {
  const msg = message || "";
  if (msg.includes("SOLD_OUT")) return "sold_out";
  if (msg.includes("BAD_QUANTITY")) return "quantity";
  if (msg.includes("BUYER_DETAILS_REQUIRED")) return "buyer";
  if (msg.includes("ACCOUNT_NOT_FOUND")) return "account";
  if (msg.includes("ORDER_NOT_FOUND")) return "order_missing";
  if (msg.includes("SHOW_NOT_FOUND")) return "show_missing";
  if (msg.includes("Could not find the function") || msg.includes("PGRST202")) {
    return "rpc_missing";
  }
  return "edit";
}

export async function updateSupabaseOrderAction(formData: FormData) {
  const supabase = await requireSupabaseAdmin();
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const buyerName = String(formData.get("buyerName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const contactExtra = String(formData.get("contactExtra") || "").trim();
  const accountEmail = String(formData.get("accountEmail") || "").trim().toLowerCase();
  const quantity = Number.parseInt(String(formData.get("quantity") || ""), 10);
  const status = String(formData.get("status") || "").trim();
  const adminNote = String(formData.get("adminNote") || "").trim();
  const showIdRaw = String(formData.get("showId") || "").trim();
  const showId = showIdRaw ? Number.parseInt(showIdRaw, 10) : null;

  const { error } = await supabase.rpc("admin_update_ticket_order", {
    p_order_code: code,
    p_buyer_name: buyerName,
    p_phone: phone,
    p_contact_extra: contactExtra,
    p_quantity: quantity,
    p_status: status,
    p_admin_note: adminNote,
    p_show_id: showId && Number.isInteger(showId) ? showId : null,
    p_account_email: accountEmail || null,
  });
  if (error) {
    redirect(`/admin/online-orders?error=${orderEditErrorCode(error.message)}`);
  }

  revalidatePath("/admin/online-orders");
  revalidatePath("/admin/online-inventory");
  revalidatePath(`/orders/${code}`);
  revalidatePath("/tickets");
  redirect("/admin/online-orders?done=edit");
}
