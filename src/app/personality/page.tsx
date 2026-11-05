import { PersonalityQuiz } from "@/components/PersonalityQuiz";
import { SiteHeader } from "@/components/SiteHeader";
import { createSupabaseServerClient, getSupabaseUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PersonalityPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getSupabaseUser(supabase);

  return (
    <main className="shell shell-narrow">
      <SiteHeader />
      <section className="hero">
        <p className="eyebrow">PERSONALITY · 07</p>
        <h1>《蝶》角色人格测试</h1>
        <p>从你的选择出发，遇见《蝶》里的角色气质。</p>
      </section>
      <PersonalityQuiz isAuthenticated={Boolean(user)} />
    </main>
  );
}
