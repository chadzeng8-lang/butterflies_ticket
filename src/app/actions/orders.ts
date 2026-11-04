"use server";

import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createOrder,
  getOrderByCode,
  getUploadsDir,
  markOrderPaid,
} from "@/lib/db";

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

async function saveUploadAsync(file: File, prefix: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > 4 * 1024 * 1024) throw new Error("FILE_TOO_LARGE");
  const ext = path.extname(file.name || "").toLowerCase() || ".jpg";
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic"];
  if (!allowed.includes(ext)) throw new Error("BAD_FILE_TYPE");
  const dir = getUploadsDir();
  const name = `${prefix}-${Date.now()}${ext}`;
  const full = path.join(dir, name);
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(full, buf);
  return name;
}

export async function createOrderAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const showId = Number(formData.get("showId"));
    const buyerName = String(formData.get("buyerName") || "");
    const phone = String(formData.get("phone") || "");
    const contactExtra = String(formData.get("contactExtra") || "");
    const quantity = Number(formData.get("quantity") || "1");

    if (!buyerName.trim() || !phone.trim()) {
      return { error: "请填写姓名与手机号。" };
    }

    const order = createOrder({
      showId,
      buyerName,
      phone,
      contactExtra,
      quantity,
    });
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    redirect(`/orders/${order.code}`);
  } catch (e) {
    if (isNextRedirect(e)) throw e;
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    const map: Record<string, string> = {
      SHOW_NOT_FOUND: "场次不存在。",
      SHOW_OFF_SALE: "该场次已停售。",
      BAD_QUANTITY: "每笔订单最多购买 5 张票。",
      PERSON_TICKET_LIMIT: "同一购票人最多登记 5 张票，包含其他尚未取消的订单。",
      SOLD_OUT: "余票不足，请减少票数或换场。",
    };
    return { error: map[msg] || "下单失败，请稍后重试。" };
  }
}

export async function markPaidAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  let code = "";
  try {
    code = String(formData.get("code") || "").trim().toUpperCase();
    const order = getOrderByCode(code);
    if (!order) return { error: "订单不存在。" };

    const proof = formData.get("proof");
    let proofPath: string | null = null;
    if (proof instanceof File && proof.size > 0) {
      proofPath = await saveUploadAsync(proof, order.code);
    }

    markOrderPaid(code, proofPath);
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
    };
    return { error: map[msg] || "提交失败，请稍后重试。" };
  }

  redirect(`/orders/${code}?paid=1`);
}
