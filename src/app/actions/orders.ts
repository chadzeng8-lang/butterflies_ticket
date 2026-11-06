"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isCurrentUserTicketingAdmin } from "@/lib/admin";
import {
  createSupabaseServerClient,
  getSupabaseUser,
} from "@/lib/supabase/server";
import {
  sendOrderCreatedEmail,
  sendPaymentSubmittedEmail,
} from "@/lib/ticket-email";
import { isTicketSaleOpen, ticketSaleClosedMessage } from "@/lib/ticket-sale";

export type ActionState = { error?: string };

function isNextRedirect(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as { digest?: unknown }).digest === "string" &&
    String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function createOrderAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getSupabaseUser(supabase);
    if (!user) redirect(`/account?next=/shows/${formData.get("showId")}`);

    const showId = Number(formData.get("showId"));
    const phone = String(formData.get("phone") || "").trim();
    const contactExtra = String(formData.get("contactExtra") || "")
      .trim()
      .toLowerCase();
    const quantity = Number(formData.get("quantity") || "1");

    if (!Number.isInteger(showId) || showId < 1 || !phone) {
      return { error: "请填写手机号。" };
    }
    if (!contactExtra) {
      return { error: "请填写邮箱。" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    const buyerName = String(profile?.full_name || "").trim() || "观众";

    const isAdmin = await isCurrentUserTicketingAdmin(supabase);
    if (!isTicketSaleOpen() && !isAdmin) {
      return { error: ticketSaleClosedMessage() };
    }

    const { data, error } = await supabase.rpc("create_ticket_order", {
      p_show_id: showId,
      p_buyer_name: buyerName,
      p_phone: phone,
      p_contact_extra: contactExtra,
      p_quantity: quantity,
    });
    if (error) throw new Error(error.message);
    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.order_code) throw new Error("ORDER_CREATE_FAILED");

    try {
      await sendOrderCreatedEmail({
        to: contactExtra,
        buyerName,
        orderCode: String(result.order_code),
      });
    } catch {
      // 邮件失败不阻断下单；用户仍可在订单页完成付款。
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    redirect(`/orders/${result.order_code}`);
  } catch (e) {
    if (isNextRedirect(e)) throw e;
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    const map: Record<string, string> = {
      SHOW_NOT_FOUND: "场次不存在。",
      SHOW_OFF_SALE: "该场次已停售。",
      BAD_QUANTITY: "每笔订单最多购买 5 张票。",
      SOLD_OUT: "余票不足，请减少票数或换场。",
      AUTH_REQUIRED: "请先登录邮箱账号再登记。",
      PERSON_TICKET_LIMIT: "同一账号最多登记 5 张票。",
      AUTH_LOOKUP_FAILED: "登录状态检查失败，请重新登录。",
      ORDER_CREATE_FAILED: "创建订单失败，请稍后再试。",
    };
    return { error: map[msg] || "下单失败，请稍后重试。" };
  }
}

export async function markPaidAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  let code = "";
  let uploadedPath: string | null = null;
  try {
    code = String(formData.get("code") || "").trim().toUpperCase();
    const supabase = await createSupabaseServerClient();
    const user = await getSupabaseUser(supabase);
    if (!user) redirect("/account");

    const { data: ownedOrder, error: orderLookupError } = await supabase
      .from("orders")
      .select("code, buyer_name, contact_extra")
      .eq("code", code)
      .maybeSingle();
    if (orderLookupError) throw new Error("ORDER_LOOKUP_FAILED");
    if (!ownedOrder) return { error: "订单不存在。" };

    const proof = formData.get("proof");
    if (proof instanceof File && proof.size > 0) {
      if (proof.size > 4 * 1024 * 1024) throw new Error("FILE_TOO_LARGE");
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(proof.type)) {
        throw new Error("BAD_FILE_TYPE");
      }
      uploadedPath = `${user.id}/${code}/${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(uploadedPath, proof, { contentType: proof.type, upsert: false });
      if (uploadError) throw new Error("PROOF_UPLOAD_FAILED");
    }

    const { error } = await supabase.rpc("submit_ticket_payment", {
      p_order_code: code,
      p_payment_proof_path: uploadedPath,
    });
    if (error) {
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage
          .from("payment-proofs")
          .remove([uploadedPath]);
        if (cleanupError) throw new Error("PROOF_CLEANUP_FAILED");
      }
      throw new Error(error.message);
    }

    const mailTo =
      String(ownedOrder.contact_extra || "").trim() || user.email || "";
    if (mailTo) {
      try {
        await sendPaymentSubmittedEmail({
          to: mailTo,
          buyerName: String(ownedOrder.buyer_name || "").trim() || "观众",
          orderCode: code,
        });
      } catch {
        // 邮件失败不阻断付款申报。
      }
    }

    revalidatePath(`/orders/${code}`);
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath("/tickets");
  } catch (e) {
    if (isNextRedirect(e)) throw e;
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    const map: Record<string, string> = {
      ORDER_NOT_FOUND: "订单不存在。",
      ORDER_CLOSED: "订单已取消或过期，库存已释放。",
      ORDER_ALREADY_PAID: "订单已处理，无需重复提交。",
      FILE_TOO_LARGE: "截图请小于 4MB。",
      BAD_FILE_TYPE: "仅支持图片截图。",
      ORDER_NOT_PAYABLE: "订单不存在、已过期或已提交付款。",
      PROOF_UPLOAD_FAILED: "付款截图上传失败，请稍后重试。",
      AUTH_LOOKUP_FAILED: "登录状态检查失败，请重新登录。",
      ORDER_LOOKUP_FAILED: "订单查询失败，请稍后重试。",
      PROOF_CLEANUP_FAILED: "付款截图处理失败，请联系工作人员。",
    };
    return { error: map[msg] || "提交失败，请稍后重试。" };
  }

  redirect(`/orders/${code}?paid=1`);
}
