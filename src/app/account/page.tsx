import Link from "next/link";
import { AccountForm } from "@/components/AccountForm";
import { SiteHeader } from "@/components/SiteHeader";
import { signOutAction } from "@/app/actions/account";
import { ORDER_STATUS_LABEL } from "@/lib/types";
import {
  createSupabaseServerClient,
  getSupabaseUser,
} from "@/lib/supabase/server";
import { listSupabaseOrdersForCurrentUser } from "@/lib/supabase/orders";
import { getPersonalityResultForCurrentUser } from "@/lib/supabase/personality";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const candidate = params.next || "";
  const nextPath =
    candidate.startsWith("/") &&
    !candidate.startsWith("//") &&
    !candidate.startsWith("/account")
      ? candidate
      : "/account";
  const supabase = await createSupabaseServerClient();
  const user = await getSupabaseUser(supabase);
  let isAdmin = false;
  let nickname = "";
  let orderCount = 0;
  let ticketCount = 0;
  let latestOrder: {
    code: string;
    status: string;
  } | null = null;
  let personalityResult = null;
  let personalityMigrationRequired = false;
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw new Error("PROFILE_LOOKUP_FAILED");
    isAdmin = profile?.role === "admin";
    nickname = String(profile?.full_name || "").trim();
    const records = await listSupabaseOrdersForCurrentUser();
    orderCount = records.length;
    ticketCount = records.reduce((total, record) => total + record.tickets.length, 0);
    if (records[0]) {
      latestOrder = {
        code: records[0].order.code,
        status: ORDER_STATUS_LABEL[records[0].order.status],
      };
    }
    try {
      personalityResult = await getPersonalityResultForCurrentUser();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "PERSONALITY_RESULT_MIGRATION_REQUIRED"
      ) {
        personalityMigrationRequired = true;
      } else {
        throw error;
      }
    }
  }

  return (
    <main className="shell shell-narrow">
      <SiteHeader />
      <section className="hero">
        <h1>{user ? `你好，${nickname || "朋友"}` : "我的账号"}</h1>
      </section>
      {user ? (
        <div className="grid">
        <article className="panel">
          <div className="account-heading">
            <div>
              <p className="eyebrow">SIGNED IN</p>
              <h2>{user.email}</h2>
            </div>
            <form action={signOutAction}>
              <button className="btn secondary" type="submit">登出</button>
            </form>
          </div>
          <div className="row" style={{ marginTop: "1rem" }}>
            <Link className="btn" href="/shows">选择场次</Link>
            <Link className="btn secondary" href="/personality">
              {personalityResult ? "重新测试人格" : "开始人格测试"}
            </Link>
            {isAdmin && (
              <>
                <Link className="btn secondary" href="/admin/online-orders">
                  管理在线订单
                </Link>
                <Link className="btn secondary" href="/admin/online-accounts">
                  管理账号
                </Link>
              </>
            )}
          </div>
        </article>

        <section className="account-section">
          <div className="section-head">
            <div>
              <p className="eyebrow">YOUR TICKETS</p>
              <h2>我的演出票</h2>
            </div>
          </div>
          <Link className="panel account-shortcut" href="/tickets">
            <strong>
              {ticketCount} 张演出票 · {orderCount} 笔订单
            </strong>
            {latestOrder && (
              <span className="muted">
                最近订单 {latestOrder.code} · {latestOrder.status}
              </span>
            )}
            <span>前往票夹查看电子票 →</span>
          </Link>
        </section>

        <section className="account-section">
          <div className="section-head">
            <div>
              <p className="eyebrow">YOUR CHARACTER</p>
              <h2>我的人格测试</h2>
            </div>
          </div>
          <Link className="panel account-shortcut" href="/personality">
            {personalityMigrationRequired ? (
              <strong>结果暂不可读取</strong>
            ) : personalityResult ? (
              <strong>{personalityResult.character.archetype} · {personalityResult.character.role}</strong>
            ) : (
              <strong>尚未完成测试</strong>
            )}
            <span className="muted">
              {personalityMigrationRequired
                ? "打开人格测试页面"
                : personalityResult
                  ? `最近测试：${new Intl.DateTimeFormat("zh-CN", {
                      dateStyle: "medium",
                    }).format(new Date(personalityResult.testedAt))}`
                  : "完成测试后可在此查看简要结果"}
            </span>
            <span>前往人格测试查看结果 →</span>
          </Link>
        </section>
        </div>
      ) : (
        <AccountForm nextPath={nextPath} />
      )}
    </main>
  );
}
