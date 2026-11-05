"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AccountActionState = { error?: string; message?: string };

function getSafeNextPath(value: FormDataEntryValue | null): string {
  const nextPath = typeof value === "string" ? value : "";
  return nextPath.startsWith("/") && !nextPath.startsWith("//") && !nextPath.startsWith("/account")
    ? nextPath
    : "/account";
}

export async function signInAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const nextPath = getSafeNextPath(formData.get("next"));
  if (!email || !password) return { error: "請輸入電郵及密碼。" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "登入失敗，請檢查電郵和密碼。" };
  redirect(nextPath);
}

export async function signUpAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("fullName") || "").trim();
  const nextPath = getSafeNextPath(formData.get("next"));
  if (!email || !password || !fullName) {
    return { error: "請填寫姓名、電郵及密碼。" };
  }
  if (password.length < 8) return { error: "密碼至少需要 8 個字元。" };

  const supabase = await createSupabaseServerClient();
  const requestHeaders = await headers();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestHeaders.get("origin");
  if (!siteUrl) return { error: "註冊設定未完成，請聯絡管理員。" };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: new URL(
        `/auth/callback?next=${encodeURIComponent(nextPath)}`,
        siteUrl
      ).toString(),
    },
  });
  if (error) return { error: "註冊失敗，請確認電郵格式並稍後再試。" };
  if (!data.session) {
    return {
      message:
        "註冊成功。請到電郵收取驗證連結，驗證後再登入。若未收到，請檢查垃圾郵件資料夾。",
    };
  }
  redirect(nextPath);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("SIGN_OUT_FAILED");
  redirect("/account");
}
