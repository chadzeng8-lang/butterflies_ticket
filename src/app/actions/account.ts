"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getSignupSkipEmailConfirm,
  setSignupSkipEmailConfirm,
} from "@/lib/dev-flags";
import { createSupabaseServerClient, getSupabaseUser } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getPublicSiteUrl } from "@/lib/site-url";

export type AccountActionState = { error?: string; message?: string };

function getSafeNextPath(value: FormDataEntryValue | null): string {
  const nextPath = typeof value === "string" ? value : "";
  return nextPath.startsWith("/") && !nextPath.startsWith("//") && !nextPath.startsWith("/account")
    ? nextPath
    : "/account";
}

async function requireLocalDevAdmin() {
  if (process.env.NODE_ENV !== "development") {
    redirect("/account");
  }
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

export async function toggleSignupSkipEmailConfirmAction(
  formData: FormData,
): Promise<void> {
  await requireLocalDevAdmin();
  const enabled = String(formData.get("enabled") || "") === "1";
  setSignupSkipEmailConfirm(enabled);
  revalidatePath("/account");
  redirect(enabled ? "/account?dev=signup_skip_on" : "/account?dev=signup_skip_off");
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

  // 管理员在账号页一键开启后：用 service role 直接创建已验证账号；关闭后完整走下方邮箱验证注册。
  if (getSignupSkipEmailConfirm()) {
    const admin = createSupabaseServiceClient();
    if (!admin) {
      return {
        error:
          "已开启免验证注册，请在 .env.local 配置 SUPABASE_SERVICE_ROLE_KEY；或到账号页关掉开关恢复邮箱验证。",
      };
    }
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createError) {
      const msg = createError.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered")) {
        return { error: "该邮箱已注册，请直接登录。" };
      }
      return { error: "本地注册失败，请稍后再试。" };
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      return { error: "账号已创建，但自动登录失败，请手动登录。" };
    }
    redirect(nextPath);
  }

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
