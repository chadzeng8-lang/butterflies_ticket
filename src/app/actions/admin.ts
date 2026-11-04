"use server";

import fs from "fs";
import path from "path";
import { redirect } from "next/navigation";
import {
  checkAdminPassword,
  clearAdminSession,
  requireAdmin,
  setAdminSession,
} from "@/lib/auth";
import {
  confirmOrder,
  createShow,
  getShow,
  getUploadsDir,
  rejectOrder,
  releaseOrder,
  updateShow,
} from "@/lib/db";
import { amountInputToCents } from "@/lib/money";

export type ActionState = { error?: string; ok?: string };

async function saveUploadAsync(file: File, prefix: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > 4 * 1024 * 1024) throw new Error("FILE_TOO_LARGE");
  const ext = path.extname(file.name || "").toLowerCase() || ".jpg";
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  if (!allowed.includes(ext)) throw new Error("BAD_FILE_TYPE");
  const name = `${prefix}-${Date.now()}${ext}`;
  const full = path.join(getUploadsDir(), name);
  fs.writeFileSync(full, Buffer.from(await file.arrayBuffer()));
  return name;
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const password = String(formData.get("password") || "");
  if (!checkAdminPassword(password)) {
    return { error: "密码错误。" };
  }
  await setAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function createShowAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
    const title = String(formData.get("title") || "").trim();
    const venue = String(formData.get("venue") || "").trim();
    const startsAtLocal = String(formData.get("startsAt") || "");
    if (!title || !venue || !startsAtLocal) {
      return { error: "请填写标题、地点与开演时间。" };
    }
    const startsAt = new Date(startsAtLocal).toISOString();
    createShow({
      title,
      description: String(formData.get("description") || ""),
      venue,
      startsAt,
      capacity: Number(formData.get("capacity") || 0),
      ticketPriceCents: amountInputToCents(String(formData.get("ticketPrice") || "0")),
      depositCents: amountInputToCents(String(formData.get("deposit") || "0")),
      onSale: formData.get("onSale") === "on",
      paymentNote: String(formData.get("paymentNote") || ""),
    });
    redirect("/admin/shows");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NEXT_REDIRECT") throw e;
    if (msg === "UNAUTHORIZED") redirect("/admin/login");
    return { error: "创建失败。" };
  }
}

export async function updateShowAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
    const id = Number(formData.get("id"));
    const current = getShow(id);
    if (!current) return { error: "场次不存在。" };

    const wechat = formData.get("wechatQr");
    const alipay = formData.get("alipayQr");
    const fps = formData.get("fpsQr");

    const wechatQrPath =
      wechat instanceof File && wechat.size > 0
        ? await saveUploadAsync(wechat, `wechat-${id}`)
        : undefined;
    const alipayQrPath =
      alipay instanceof File && alipay.size > 0
        ? await saveUploadAsync(alipay, `alipay-${id}`)
        : undefined;
    const fpsQrPath =
      fps instanceof File && fps.size > 0
        ? await saveUploadAsync(fps, `fps-${id}`)
        : undefined;

    const startsAtLocal = String(formData.get("startsAt") || "");
    updateShow(id, {
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
      venue: String(formData.get("venue") || ""),
      startsAt: startsAtLocal ? new Date(startsAtLocal).toISOString() : current.startsAt,
      capacity: Number(formData.get("capacity") || current.capacity),
      ticketPriceCents: amountInputToCents(String(formData.get("ticketPrice") || "0")),
      depositCents: amountInputToCents(String(formData.get("deposit") || "0")),
      onSale: formData.get("onSale") === "on",
      paymentNote: String(formData.get("paymentNote") || ""),
      wechatQrPath,
      alipayQrPath,
      fpsQrPath,
    });
    return { ok: "已保存场次设置。" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "UNAUTHORIZED") redirect("/admin/login");
    return { error: "保存失败。" };
  }
}

export async function confirmOrderAction(formData: FormData) {
  try {
    await requireAdmin();
    const code = String(formData.get("code") || "");
    confirmOrder(code);
    redirect("/admin/orders?status=pending_confirm");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NEXT_REDIRECT") throw e;
    if (msg === "UNAUTHORIZED") redirect("/admin/login");
    redirect("/admin/orders?status=pending_confirm");
  }
}

export async function rejectOrderAction(formData: FormData) {
  try {
    await requireAdmin();
    const code = String(formData.get("code") || "");
    const reason = String(formData.get("reason") || "金额不符或未到账");
    rejectOrder(code, reason);
    redirect("/admin/orders?status=pending_confirm");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NEXT_REDIRECT") throw e;
    if (msg === "UNAUTHORIZED") redirect("/admin/login");
    redirect("/admin/orders?status=pending_confirm");
  }
}

export async function releaseOrderAction(formData: FormData) {
  try {
    await requireAdmin();
    const code = String(formData.get("code") || "");
    releaseOrder(code);
    redirect("/admin/orders");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NEXT_REDIRECT") throw e;
    if (msg === "UNAUTHORIZED") redirect("/admin/login");
    redirect("/admin/orders");
  }
}
