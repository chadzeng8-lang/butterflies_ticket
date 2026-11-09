import fs from "fs";
import path from "path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const SIGNUP_SKIP_SETTING_KEY = "signup_skip_email_confirm";

const LOCAL_FLAGS_PATH = path.join(process.cwd(), "data", "dev-flags.json");

function readLocalFallback(): boolean | null {
  try {
    if (!fs.existsSync(LOCAL_FLAGS_PATH)) return null;
    const parsed = JSON.parse(fs.readFileSync(LOCAL_FLAGS_PATH, "utf8")) as {
      signupSkipEmailConfirm?: boolean;
    };
    if (typeof parsed.signupSkipEmailConfirm === "boolean") {
      return parsed.signupSkipEmailConfirm;
    }
  } catch {
    // ignore
  }
  if (process.env.SIGNUP_SKIP_EMAIL_CONFIRM === "true") return true;
  if (process.env.SIGNUP_SKIP_EMAIL_CONFIRM === "false") return false;
  return null;
}

function writeLocalFallback(enabled: boolean): void {
  try {
    fs.mkdirSync(path.dirname(LOCAL_FLAGS_PATH), { recursive: true });
    fs.writeFileSync(
      LOCAL_FLAGS_PATH,
      `${JSON.stringify({ signupSkipEmailConfirm: enabled }, null, 2)}\n`,
      "utf8",
    );
  } catch {
    // Netlify 等只读环境忽略
  }
}

function parseSettingValue(value: unknown): boolean {
  return value === true || value === "true";
}

/** 是否跳过注册邮箱验证（优先读 Supabase app_settings，表未就绪时回退本地文件）。 */
export async function getSignupSkipEmailConfirm(
  supabase?: SupabaseClient,
): Promise<boolean> {
  const client = supabase ?? (await createSupabaseServerClient());
  const { data, error } = await client
    .from("app_settings")
    .select("value")
    .eq("key", SIGNUP_SKIP_SETTING_KEY)
    .maybeSingle();

  if (!error && data) {
    return parseSettingValue(data.value);
  }

  return readLocalFallback() === true;
}

export async function setSignupSkipEmailConfirm(
  supabase: SupabaseClient,
  enabled: boolean,
  updatedBy: string | null,
): Promise<{ ok: true } | { ok: false; missingTable: boolean }> {
  const { error } = await supabase.from("app_settings").upsert(
    {
      key: SIGNUP_SKIP_SETTING_KEY,
      value: enabled,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    },
    { onConflict: "key" },
  );

  if (error) {
    const missing = /could not find the table|schema cache|does not exist/i.test(
      error.message || "",
    );
    if (missing && process.env.NODE_ENV === "development") {
      writeLocalFallback(enabled);
      return { ok: true };
    }
    return { ok: false, missingTable: missing };
  }

  writeLocalFallback(enabled);
  return { ok: true };
}
