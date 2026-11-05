import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUser } from "@/lib/supabase/server";

export async function isCurrentUserTicketingAdmin(
  supabase: SupabaseClient,
): Promise<boolean> {
  const user = await getSupabaseUser(supabase);
  if (!user) return false;
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error("ADMIN_LOOKUP_FAILED");
  return data?.role === "admin";
}
