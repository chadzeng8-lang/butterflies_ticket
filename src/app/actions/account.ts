"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicSiteUrl } from "@/lib/site-url";

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
  if (!email || !password) return { error: "请输入邮箱及密码。" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "登录失败，请检查邮箱和密码。" };
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
    return { error: "请填写昵称、邮箱及密码。" };
  }
  if (password.length < 8) return { error: "密码至少需要 8 个字符。" };

  const supabase = await createSupabaseServerClient();
  const siteUrl = getPublicSiteUrl();
  if (!siteUrl) return { error: "注册设置未完成，请联系管理员。" };
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
  if (error) return { error: "注册失败，请确认邮箱格式并稍后再试。" };
  if (!data.session) {
    return {
      message:
        "注册成功。请到邮箱收取验证链接，验证后再登录。若未收到，请检查垃圾邮件文件夹。",
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
