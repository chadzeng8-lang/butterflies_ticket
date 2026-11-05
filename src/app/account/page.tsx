import Link from "next/link";
import { AccountForm } from "@/components/AccountForm";
import { SiteHeader } from "@/components/SiteHeader";
import { signOutAction } from "@/app/actions/account";
import { TicketOrderList, type TicketOrderView } from "@/components/TicketOrderList";
import { PersonalityResultView } from "@/components/PersonalityResultView";
import { centsToCny } from "@/lib/money";
import { toDataUrl } from "@/lib/qr";
import { signTicketCode } from "@/lib/ticket-token";
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
  let orders: TicketOrderView[] = [];
  let personalityResult = null;
  let personalityMigrationRequired = false;
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw new Error("PROFILE_LOOKUP_FAILED");
    isAdmin = profile?.role === "admin";
    const records = await listSupabaseOrdersForCurrentUser();
    orders = await Promise.all(
      records.map(async ({ order, tickets }) => ({
        id: order.id,
        code: order.code,
        status: ORDER_STATUS_LABEL[order.status],
        showTitle: order.showTitle,
        showStartsAt: order.showStartsAt,
        showVenue: order.showVenue,
        quantity: order.quantity,
        total: centsToCny(order.ticketTotalCents + order.depositTotalCents),
        tickets: await Promise.all(
          tickets.map(async (ticket) => ({
            code: ticket.code,
            status: ticket.depositRefundedAt
              ? "按金已退"
              : ticket.checkedInAt
                ? "已核销"
                : "待核销",
            dataUrl: await toDataUrl(signTicketCode(ticket.code)),
          }))
        ),
      }))
    );
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
        <h1>我的账号</h1>
        <p>查看账号关联的演出票券与《蝶》角色人格结果。</p>
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
            <Link className="btn" href="/">选择场次</Link>
            <Link className="btn secondary" href="/personality">
              {personalityResult ? "重新测试人格" : "开始人格测试"}
            </Link>
            {isAdmin && (
              <Link className="btn secondary" href="/admin/online-orders">
                管理在线订单
              </Link>
            )}
          </div>
        </article>

        <section className="account-section">
          <div className="section-head">
            <div>
              <p className="eyebrow">YOUR TICKETS</p>
              <h2>我的演出票</h2>
            </div>
            <Link href="/tickets">票夹 →</Link>
          </div>
          {orders.length ? (
            <TicketOrderList orders={orders} />
          ) : (
            <article className="panel muted">
              这个账号目前没有关联的订单。选好场次并完成登记后，票券会显示在这里。
            </article>
          )}
        </section>

        <section className="account-section">
          <div className="section-head">
            <div>
              <p className="eyebrow">YOUR CHARACTER</p>
              <h2>我的人格测试</h2>
            </div>
          </div>
          {personalityMigrationRequired ? (
            <div className="notice">
              人格测试数据表尚未设置。请先运行项目提供的 Supabase 人格结果迁移。
            </div>
          ) : personalityResult ? (
            <PersonalityResultView
              character={personalityResult.character}
              testedAt={personalityResult.testedAt}
            />
          ) : (
            <article className="panel">
              <p className="muted">
                完成 24 道题后，你的角色结果会保存在账号中，并显示在这里。
              </p>
              <Link className="btn" href="/personality">开始《蝶》角色人格测试</Link>
            </article>
          )}
        </section>
        </div>
      ) : (
        <AccountForm nextPath={nextPath} />
      )}
    </main>
  );
}
