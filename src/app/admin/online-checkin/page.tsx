import { redirect } from "next/navigation";
import { OnlineCheckInPanel } from "@/components/OnlineCheckInPanel";
import { SiteHeader } from "@/components/SiteHeader";
import { createSupabaseServerClient, getSupabaseUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnlineCheckInPage() {
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

  return (
    <main className="shell">
      <SiteHeader />
      <section className="hero">
        <h1>现场核销</h1>
        <p>扫描 Supabase 订单电子票，核对观众信息；现场完成签到与按金退还后，再登记核销。</p>
      </section>
      <OnlineCheckInPanel />
    </main>
  );
}
