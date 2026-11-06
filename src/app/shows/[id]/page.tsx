import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { OrderForm } from "@/components/OrderForm";
import { isCurrentUserTicketingAdmin } from "@/lib/admin";
import { formatShowTime } from "@/lib/format";
import { centsToCny } from "@/lib/money";
import { audiencePricingSummary, depositRuleNotice } from "@/lib/pricing-copy";
import {
  createSupabaseServerClient,
  getSupabaseUser,
} from "@/lib/supabase/server";
import { getSupabaseShow } from "@/lib/supabase/shows";
import {
  isTicketSaleOpen,
  ticketSaleClosedMessage,
  ticketSaleOpensLabel,
} from "@/lib/ticket-sale";

export const dynamic = "force-dynamic";

export default async function ShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const showId = Number(id);
  if (!Number.isSafeInteger(showId) || showId < 1) notFound();
  const show = await getSupabaseShow(showId);
  if (!show || !show.onSale) notFound();
  const totalPay = show.ticketPriceCents + show.depositCents;
  const supabase = await createSupabaseServerClient();
  const user = await getSupabaseUser(supabase);
  const isAdmin = await isCurrentUserTicketingAdmin(supabase);
  const saleOpen = isTicketSaleOpen();
  const canRegister = saleOpen || isAdmin;

  return (
    <main className="shell shell-narrow">
      <SiteHeader />
      <section className="hero">
        <div className="chip" style={{ marginBottom: "1rem" }}>
          <span className="chip-tag">场次</span>
          {saleOpen
            ? "开放登记"
            : isAdmin
              ? "管理员可提前登记"
              : `${ticketSaleOpensLabel()} 开票`}
        </div>
        <h1>{formatShowTime(show.startsAt)}</h1>
        <p>
          《蝶》沉浸版展演 · {show.venue}
        </p>
      </section>

      <div className="grid">
        <article className="panel">
          <h2>费用</h2>
          <div className="meta">
            <span className="price">
              {audiencePricingSummary(show.ticketPriceCents, show.depositCents)}
            </span>
            <span>
              现在转账 <span className="price">{centsToCny(totalPay)}</span>/人
            </span>
          </div>
          <div className="notice" style={{ marginTop: "1rem" }}>
            <strong>按金规则</strong>
            {depositRuleNotice()}
          </div>
        </article>

        <article className="panel">
          <h2>登记信息</h2>
          {!canRegister ? (
            <div className="notice">
              <strong>尚未开票</strong>
              <p>{ticketSaleClosedMessage()}</p>
            </div>
          ) : !user ? (
            <div className="notice">
              <p>需先使用电邮账号登录，登录后即可登记场次。</p>
              <Link className="btn" href={`/account?next=${encodeURIComponent(`/shows/${show.id}`)}`}>
                登录或注册
              </Link>
            </div>
          ) : (
            <>
              {!saleOpen && isAdmin && (
                <p className="notice" style={{ marginBottom: "1rem" }}>
                  公开开票前，管理员可提前登记本场。
                </p>
              )}
              <OrderForm
                showId={show.id}
                maxQuantity={5}
                accountEmail={user.email || ""}
              />
            </>
          )}
          <p style={{ marginTop: "1.1rem" }}>
            <Link className="muted" href="/shows">
              ← 返回场次
            </Link>
          </p>
        </article>
      </div>
    </main>
  );
}
