import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_CONFIG_MISSING");
  }

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}

export async function getSupabaseUser(
  supabase: SupabaseClient
): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    // 过期 / 无效 cookie 等鉴权错误一律视为未登录，避免整站 500
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}
