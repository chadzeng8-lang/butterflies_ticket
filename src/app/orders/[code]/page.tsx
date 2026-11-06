import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkPaidForm } from "@/components/MarkPaidForm";
import { PaymentMethods } from "@/components/PaymentMethods";
import { SiteHeader } from "@/components/SiteHeader";
import { isCurrentUserTicketingAdmin } from "@/lib/admin";
import { formatShowTime } from "@/lib/format";
import { centsToCny } from "@/lib/money";
import { depositAmounts } from "@/lib/payment-methods";
import { depositPerPersonLabel } from "@/lib/pricing-copy";
import { getSupabaseOrderWithShow } from "@/lib/supabase/orders";
import { loadPurchaseNumbersForShows } from "@/lib/supabase/purchase-numbers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ORDER_STATUS_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { code } = await params;
  const sp = await searchParams;
  const supabaseRecord = await getSupabaseOrderWithShow(decodeURIComponent(code));
  if (!supabaseRecord) notFound();
  const { order, show } = supabaseRecord;
  const supabase = await createSupabaseServerClient();
  const isAdmin = await isCurrentUserTicketingAdmin(supabase);

  const total = order.ticketTotalCents + order.depositTotalCents;
  const depositBoth = depositAmounts(order.quantity);
  const issued =
    order.status === "issued" ||
    order.status === "checked_in" ||
    order.status === "deposit_refunded";
  const tickets = issued ? supabaseRecord.tickets : [];
  const purchaseNumbers = await loadPurchaseNumbersForShows([order.showId]);
  const purchaseNo = purchaseNumbers.get(order.id) || null;
  const heroTitle = purchaseNo
    ? `购票编号 ${purchaseNo}`
    : ORDER_STATUS_LABEL[order.status];

  return (
    <main className="shell shell-narrow">
      <SiteHeader />
      <section className="hero">
        <div className="chip" style={{ marginBottom: "1rem" }}>
          <span className="chip-tag">订单</span>
          {ORDER_STATUS_LABEL[order.status]}
        </div>
        <h1>{heroTitle}</h1>
        <p>
          {formatShowTime(order.showStartsAt)} · {order.showVenue}
        </p>
      </section>

      <div className="grid">
        <article className="panel">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2>订单状态</h2>
            <span
              className={`badge ${
                order.status === "pending_confirm" || order.status === "pending_payment"
                  ? "warn"
                  : order.status === "issued" ||
                      order.status === "checked_in" ||
                      order.status === "deposit_refunded"
                    ? "success"
                    : order.status === "expired" || order.status === "cancelled"
                      ? "danger"
                      : ""
              }`}
            >
              {ORDER_STATUS_LABEL[order.status]}
            </span>
          </div>
          <div className="meta" style={{ marginTop: "0.75rem" }}>
            <span>
              {order.phone} · {order.quantity} 张
            </span>
            <span>
              {order.ticketTotalCents === 0
                ? "公益免费 · 按金 "
                : `票款 ${centsToCny(order.ticketTotalCents)} + 按金 `}
              <span className="price">
                ¥{depositBoth.rmb} / HK${depositBoth.hkd}
              </span>
              {order.ticketTotalCents === 0 ? "（到场全退）" : ""}
              {order.ticketTotalCents > 0 ? (
                <>
                  {" "}
                  · 合计参考 {centsToCny(total)}
                </>
              ) : null}
            </span>
            {order.status === "pending_payment" && (
              <span>请于 {formatShowTime(order.expiresAt)} 前完成付款并点「我已付款」</span>
            )}
            {order.adminNote && <span>备注：{order.adminNote}</span>}
          </div>
          {sp.paid === "1" && order.status === "pending_confirm" && (
            <div className="success" style={{ marginTop: "0.9rem" }}>
              已收到你的付款申报，干事核对到账后会出票。请保存本页或到「我的票夹」查询。
            </div>
          )}
          {order.status === "pending_confirm" && sp.paid !== "1" && (
            <div className="success" style={{ marginTop: "0.9rem" }}>
              状态：待干事确认收款。确认后将发放电子票。
            </div>
          )}
        </article>

        {order.status === "pending_payment" && (
          <article className="panel">
            <h2>转账付款</h2>
            {show.paymentNote && (
              <p className="muted" style={{ marginBottom: "0.9rem" }}>
                {show.paymentNote}
              </p>
            )}
            <PaymentMethods quantity={order.quantity} phone={order.phone} />
            <div style={{ marginTop: "1.1rem" }}>
              <MarkPaidForm code={order.code} />
            </div>
          </article>
        )}

        {order.status === "pending_confirm" && (
          <article className="panel">
            <h2>等待确认</h2>
            <p className="muted">
              你已提交付款申报。干事确认到账后会正式出票，请勿重复转账。
            </p>
          </article>
        )}

        {tickets.length > 0 && (
          <article className="panel">
            <h2>入场凭证</h2>
            <div className="ticket-entry-card">
              <p className="eyebrow">购票编号</p>
              <p className="ticket-entry-number">{purchaseNo || "—"}</p>
              <p>
                共 {order.quantity} 张 · 登记手机 <strong>{order.phone}</strong>
              </p>
              <p className="ticket-entry-note">
                入场时请向工作人员报购票编号，并核对手机号；无需出示二维码。到场观演后按金
                {depositPerPersonLabel()}全额退还。
              </p>
            </div>
          </article>
        )}

        <p>
          <Link href="/tickets">去票夹查询</Link> ·{" "}
          {isAdmin ? (
            <Link href="/campus-entry">入校预约指南</Link>
          ) : (
            <span className="muted">入校指南（暂未开放）</span>
          )}{" "}
          · <Link href="/">返回首页</Link>
        </p>
      </div>
    </main>
  );
}
