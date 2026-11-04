import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkPaidForm } from "@/components/MarkPaidForm";
import { SiteHeader } from "@/components/SiteHeader";
import {
  getOrderWithShow,
  getShow,
  getTicketsForOrder,
} from "@/lib/db";
import { getSupabaseOrderWithShow } from "@/lib/supabase/orders";
import { formatShowTime } from "@/lib/format";
import { centsToCny } from "@/lib/money";
import { toDataUrl } from "@/lib/qr";
import { signTicketCode } from "@/lib/ticket-token";
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
  const order = supabaseRecord?.order ?? getOrderWithShow(decodeURIComponent(code));
  if (!order) notFound();
  const show = supabaseRecord?.show ?? getShow(order.showId);
  if (!show) notFound();

  const total = order.ticketTotalCents + order.depositTotalCents;
  const tickets =
    order.status === "issued" ||
    order.status === "checked_in" ||
    order.status === "deposit_refunded"
      ? supabaseRecord?.tickets ?? getTicketsForOrder(order.id)
      : [];

  const ticketQrs = await Promise.all(
    tickets.map(async (t) => ({
      code: t.code,
      checkedInAt: t.checkedInAt,
      depositRefundedAt: t.depositRefundedAt,
      dataUrl: await toDataUrl(signTicketCode(t.code)),
    }))
  );

  return (
    <main className="shell shell-narrow">
      <SiteHeader />
      <section className="hero">
        <div className="chip" style={{ marginBottom: "1rem" }}>
          <span className="chip-tag">订单</span>
          {ORDER_STATUS_LABEL[order.status]}
        </div>
        <h1>{order.code}</h1>
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
                order.status === "pending_confirm"
                  ? "warn"
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
              {order.buyerName} · {order.phone} · {order.quantity} 张
            </span>
            <span>
              {order.ticketTotalCents === 0
                ? `公益免费 · 按金 `
                : `票款 ${centsToCny(order.ticketTotalCents)} + 按金 `}
              {centsToCny(order.depositTotalCents)}
              {order.ticketTotalCents === 0 ? "（到场全退）" : ""} ={" "}
              <span className="price">{centsToCny(total)}</span>
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
            <div className="notice">
              <strong>转账备注必须填写</strong>
              <div className="order-code">{order.code}</div>
              <span>金额 {centsToCny(total)}。备注填错可能导致无法对账出票。</span>
            </div>
            {show.paymentNote && (
              <p className="muted" style={{ marginTop: "0.8rem" }}>
                {show.paymentNote}
              </p>
            )}
            <div className="qr-grid" style={{ marginTop: "1rem" }}>
              {show.wechatQrPath && (
                <div className="qr-box">
                  <img src={`/api/uploads/${show.wechatQrPath}`} alt="微信收款码" />
                  <div>微信</div>
                </div>
              )}
              {show.alipayQrPath && (
                <div className="qr-box">
                  <img src={`/api/uploads/${show.alipayQrPath}`} alt="支付宝收款码" />
                  <div>支付宝</div>
                </div>
              )}
              {show.fpsQrPath && (
                <div className="qr-box">
                  <img src={`/api/uploads/${show.fpsQrPath}`} alt="FPS 收款码" />
                  <div>FPS / PayMe</div>
                </div>
              )}
              {!show.wechatQrPath && !show.alipayQrPath && !show.fpsQrPath && (
                <p className="muted">
                  收款码尚未上传。请按干事公布的收款方式转账，并备注订单号。
                </p>
              )}
            </div>
            <div style={{ marginTop: "1.1rem" }}>
              {supabaseRecord ? (
                <MarkPaidForm code={order.code} />
              ) : (
                <p className="muted">
                  此为旧系统历史订单，请联系工作人员处理付款；历史订单不会自动迁移至在线账户。
                </p>
              )}
            </div>
          </article>
        )}

        {order.status === "pending_confirm" && (
          <article className="panel">
            <h2>等待确认</h2>
            <p className="muted">
              你已提交付款申报（订单号 {order.code}）。干事确认到账后会发放电子票，请勿重复转账。
            </p>
          </article>
        )}

        {ticketQrs.length > 0 && (
          <article className="panel">
            <h2>电子票</h2>
            <p className="muted">入场出示二维码。现场核销后，工作人员将全额退还每人按金 {centsToCny(show.depositCents)}。</p>
            <div className="grid" style={{ marginTop: "1rem" }}>
              {ticketQrs.map((t, idx) => (
                <div key={t.code} className="ticket card" style={{ boxShadow: "none" }}>
                  <h3>
                    第 {idx + 1} 张 · {t.code}
                  </h3>
                  <img src={t.dataUrl} alt={`票 ${t.code}`} />
                  <div className="meta" style={{ marginTop: "0.5rem" }}>
                    {t.checkedInAt ? (
                      <span>已核销</span>
                    ) : (
                      <span>待核销</span>
                    )}
                    {t.depositRefundedAt ? (
                      <span>按金已退</span>
                    ) : (
                      <span>按金待退 {centsToCny(show.depositCents)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </article>
        )}

        <p>
          <Link href="/tickets">去票夹查询</Link> · <Link href="/">返回首页</Link>
        </p>
      </div>
    </main>
  );
}
