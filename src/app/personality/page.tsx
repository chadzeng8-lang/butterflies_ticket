import nextDynamic from "next/dynamic";
import { PersonalityResultView } from "@/components/PersonalityResultView";
import { SiteHeader } from "@/components/SiteHeader";
import { createSupabaseServerClient, getSupabaseUser } from "@/lib/supabase/server";
import { getPersonalityResultForCurrentUser } from "@/lib/supabase/personality";

export const dynamic = "force-dynamic";

const PersonalityQuiz = nextDynamic(
  () => import("@/components/PersonalityQuiz").then((mod) => mod.PersonalityQuiz),
  {
    loading: () => <div className="panel muted">人格测试加载中…</div>,
  },
);

export default async function PersonalityPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getSupabaseUser(supabase);
  let savedResult = null;
  let migrationRequired = false;
  if (user) {
    try {
      savedResult = await getPersonalityResultForCurrentUser();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "PERSONALITY_RESULT_MIGRATION_REQUIRED"
      ) {
        migrationRequired = true;
      } else {
        throw error;
      }
    }
  }

  return (
    <main className="shell shell-narrow">
      <SiteHeader />
      <section className="hero personality-hero">
        <p className="eyebrow">A CHARACTER TEST · 24 QUESTIONS</p>
        <h1>测测你是《蝶》里的哪个人</h1>
      </section>
      {savedResult && (
        <PersonalityResultView
          character={savedResult.character}
          testedAt={savedResult.testedAt}
        />
      )}
      {migrationRequired && (
        <div className="notice">人格测试结果暂不可读取，请联系工作人员完成系统设置。</div>
      )}
      <PersonalityQuiz isAuthenticated={Boolean(user)} />
    </main>
  );
}
