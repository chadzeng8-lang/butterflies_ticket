import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { OrderForm } from "@/components/OrderForm";
import { getRemainingSeats, getShow } from "@/lib/db";
import { formatShowTime } from "@/lib/format";
import { centsToCny } from "@/lib/money";
import { audiencePricingSummary, depositRuleNotice } from "@/lib/pricing-copy";

export const dynamic = "force-dynamic";

export default async function ShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const show = getShow(Number(id));
  if (!show || !show.onSale) notFound();
  const remaining = getRemainingSeats(show);
  const maxQuantity = Math.min(5, remaining);
  const totalPay = show.ticketPriceCents + show.depositCents;

  return (
    <main className="shell shell-narrow">
      <SiteHeader />
      <section className="hero">
        <div className="chip" style={{ marginBottom: "1rem" }}>
          <span className="chip-tag">場次</span>
          開放登記
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
          {remaining < 1 ? (
            <p className="muted">本场已满，请返回选择其他场次。</p>
          ) : (
            <OrderForm showId={show.id} maxQuantity={maxQuantity} />
          )}
          <p style={{ marginTop: "1.1rem" }}>
            <Link className="muted" href="/">
              ← 返回场次
            </Link>
          </p>
        </article>
      </div>
    </main>
  );
}
