import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** 仅服务端使用；需要 SUPABASE_SERVICE_ROLE_KEY。生产构建请勿依赖此客户端做普通用户流程。 */
export function createSupabaseServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
