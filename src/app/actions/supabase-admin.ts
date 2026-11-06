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
    nextPath === "/admin/online-orders" ? nextPath : "/admin/online-orders";

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
  revalidatePath(`/orders/${code}`);
  revalidatePath("/tickets");
  redirect("/admin/online-orders?done=edit");
}

function safeAccountsReturn(returnTo: string): string {
  return returnTo.startsWith("/admin/online-accounts") && !returnTo.startsWith("//")
    ? returnTo
    : "/admin/online-accounts";
}

function accountsRedirect(returnTo: string, key: string, kind: "error" | "done") {
  const base = safeAccountsReturn(returnTo);
  redirect(`${base}${base.includes("?") ? "&" : "?"}${kind}=${key}`);
}

export async function rebindOrderAccountAction(formData: FormData) {
  const supabase = await requireSupabaseAdmin();
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const accountEmail = String(formData.get("accountEmail") || "").trim().toLowerCase();
  const returnTo = String(formData.get("returnTo") || "").trim();

  const { error } = await supabase.rpc("admin_rebind_order_account", {
    p_order_code: code,
    p_account_email: accountEmail,
  });
  if (error) {
    const codeKey = orderEditErrorCode(error.message);
    const mapped =
      codeKey === "account"
        ? "account"
        : codeKey === "rpc_missing" || codeKey === "migration"
          ? "migration"
          : "rebind";
    accountsRedirect(returnTo, mapped, "error");
  }

  revalidatePath("/admin/online-accounts");
  revalidatePath("/admin/online-orders");
  revalidatePath(`/orders/${code}`);
  revalidatePath("/tickets");
  accountsRedirect(returnTo, "rebind", "done");
}

export async function deleteAccountAction(formData: FormData) {
  const supabase = await requireSupabaseAdmin();
  const userId = String(formData.get("userId") || "").trim();
  const returnTo = String(formData.get("returnTo") || "").trim();

  if (!userId) {
    accountsRedirect(returnTo, "account_missing", "error");
  }

  const { error } = await supabase.rpc("admin_delete_account", {
    p_user_id: userId,
  });
  if (error) {
    const msg = error.message || "";
    if (msg.includes("CANNOT_DELETE_SELF")) {
      accountsRedirect(returnTo, "delete_self", "error");
    }
    if (msg.includes("ACCOUNT_NOT_FOUND")) {
      accountsRedirect(returnTo, "account_missing", "error");
    }
    if (msg.includes("Could not find the function") || msg.includes("PGRST202")) {
      accountsRedirect(returnTo, "delete_migration", "error");
    }
    accountsRedirect(returnTo, "delete_failed", "error");
  }

  revalidatePath("/admin/online-accounts");
  revalidatePath("/admin/online-orders");
  revalidatePath("/tickets");
  accountsRedirect(returnTo, "delete", "done");
}

const BULK_STATUS_OPTIONS = [
  "pending_payment",
  "pending_confirm",
  "issued",
  "cancelled",
  "expired",
] as const;

function collectOrderCodes(formData: FormData): string[] {
  return formData
    .getAll("codes")
    .map((value) => String(value || "").trim().toUpperCase())
    .filter(Boolean);
}

export async function bulkSetOrderStatusAction(formData: FormData) {
  const supabase = await requireSupabaseAdmin();
  const codes = collectOrderCodes(formData);
  const status = String(formData.get("status") || "").trim();

  if (codes.length === 0) {
    redirect("/admin/online-orders?error=bulk_none");
  }
  if (!BULK_STATUS_OPTIONS.includes(status as (typeof BULK_STATUS_OPTIONS)[number])) {
    redirect("/admin/online-orders?error=bulk_status");
  }

  const { error } = await supabase.rpc("admin_bulk_set_order_status", {
    p_order_codes: codes,
    p_status: status,
  });
  if (error) {
    const mapped = orderEditErrorCode(error.message);
    if (mapped === "sold_out") redirect("/admin/online-orders?error=sold_out");
    if (mapped === "rpc_missing") redirect("/admin/online-orders?error=bulk_migration");
    if ((error.message || "").includes("NO_ORDERS_SELECTED")) {
      redirect("/admin/online-orders?error=bulk_none");
    }
    redirect("/admin/online-orders?error=bulk_status_failed");
  }

  revalidatePath("/admin/online-orders");
  revalidatePath("/admin/online-accounts");
  revalidatePath("/tickets");
  redirect("/admin/online-orders?done=bulk_status");
}

export async function bulkDeleteOrdersAction(formData: FormData) {
  const supabase = await requireSupabaseAdmin();
  const codes = collectOrderCodes(formData);

  if (codes.length === 0) {
    redirect("/admin/online-orders?error=bulk_none");
  }

  const { error } = await supabase.rpc("admin_bulk_delete_orders", {
    p_order_codes: codes,
  });
  if (error) {
    if (
      (error.message || "").includes("Could not find the function") ||
      (error.message || "").includes("PGRST202")
    ) {
      redirect("/admin/online-orders?error=bulk_migration");
    }
    redirect("/admin/online-orders?error=bulk_delete_failed");
  }

  revalidatePath("/admin/online-orders");
  revalidatePath("/admin/online-accounts");
  revalidatePath("/tickets");
  redirect("/admin/online-orders?done=bulk_delete");
}
