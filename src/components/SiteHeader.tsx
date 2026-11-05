import { createSupabaseServerClient, getSupabaseUser } from "@/lib/supabase/server";
import { SiteHeaderClient } from "@/components/SiteHeaderClient";

const siteName = process.env.SITE_NAME || "《蝶》沉浸版展演";

export async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const user = await getSupabaseUser(supabase);
  let isAdmin = false;

  if (user) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw new Error("HEADER_PROFILE_LOOKUP_FAILED");
    isAdmin = profile?.role === "admin";
  }

  return (
    <SiteHeaderClient siteName={siteName} isAdmin={isAdmin} />
  );
}
