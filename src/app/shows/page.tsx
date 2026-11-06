import Link from "next/link";
import { PendingLink } from "@/components/PendingLink";
import { SiteHeader } from "@/components/SiteHeader";
import { VenueMap } from "@/components/VenueMap";
import { isCurrentUserTicketingAdmin } from "@/lib/admin";
import { listSupabaseShows } from "@/lib/supabase/shows";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatShowTime } from "@/lib/format";
import { audiencePricingSummary, depositGuideCopy, depositHeroNote } from "@/lib/pricing-copy";
import {
  isTicketSaleOpen,
  ticketSaleClosedMessage,
  ticketSaleOpensLabel,
} from "@/lib/ticket-sale";

export const dynamic = "force-dynamic";

export default async function ShowsPage() {
  const shows = await listSupabaseShows(false);
  const firstOpen = shows[0];
  const saleOpen = isTicketSaleOpen();
  const supabase = await createSupabaseServerClient();
  const isAdmin = await isCurrentUserTicketingAdmin(supabase);
  const canBook = Boolean(firstOpen) && (saleOpen || isAdmin);

  return (
    <main className="shell home-shell">
      <SiteHeader />

      <section className="section show-section" id="shows">
        <div className="section-head">
          <div>
            <p className="eyebrow">Tickets / Booking</p>
            <h2>报名与购票</h2>
            <p>请按顺序完成以下三步，即可顺利入场观演。</p>
          </div>
        </div>

        <ol className="booking-timeline">
          <li className="booking-timeline-item">
            <span className="booking-timeline-index">01</span>
            <span className="booking-timeline-dot" aria-hidden />
            <h3>选择场次进行登记</h3>
          </li>
          <li className="booking-timeline-item">
            <span className="booking-timeline-index">02</span>
            <span className="booking-timeline-dot" aria-hidden />
            <h3>缴付按金并上传凭证</h3>
          </li>
          <li className="booking-timeline-item">
            <span className="booking-timeline-index">03</span>
            <span className="booking-timeline-dot" aria-hidden />
            <h3>
              {isAdmin ? (
                <Link href="/campus-entry">微信小程序预约入校</Link>
              ) : (
                <>微信小程序预约入校（暂未开放）</>
              )}
            </h3>
          </li>
        </ol>

        <div className="booking-summary booking-summary-inline">
          <div>
            <span className="booking-kicker">公益演出</span>
            <strong className="booking-price">免费</strong>
            <span className="booking-note">{depositHeroNote()}</span>
          </div>
          {canBook ? (
            <a className="btn booking-button" href="#show-list">
              选择场次 <span aria-hidden>→</span>
            </a>
          ) : (
            <button className="btn booking-button" disabled>
              {firstOpen ? `${ticketSaleOpensLabel()} 开票` : "暂无余席"}
            </button>
          )}
        </div>
        {!saleOpen && (
          <p className="notice" style={{ marginBottom: "1.25rem" }}>
            {isAdmin
              ? `尚未到公开开票时间（${ticketSaleOpensLabel()}）。你已以管理员登录，可提前登记。`
              : ticketSaleClosedMessage()}
          </p>
        )}
        <PendingLink className="ticket-lookup-link" href="/tickets" pendingLabel="加载中…">
          已有订单？查询电子票 <span aria-hidden>→</span>
        </PendingLink>

        <div className="booking-shows-head" id="show-list">
          <h3>选择场次</h3>
          <p>座位有限，登记完成后请按订单指引支付按金。</p>
        </div>

        {shows.length === 0 ? (
          <div className="panel muted">暂无开售场次，请稍后再来。</div>
        ) : (
          <div className="show-list">
            {shows.map((show) => (
              <article key={show.id} className="show-row">
                <div className="show-date">
                  <h3>{formatShowTime(show.startsAt)}</h3>
                  <div className="meta">
                    <span>{show.venue}</span>
                    <span className="price">
                      {audiencePricingSummary(show.ticketPriceCents, show.depositCents)}
                    </span>
                  </div>
                </div>
                <div className="show-availability">
                  <span className={`badge ${canBook ? "success" : "warn"}`}>
                    {saleOpen ? "开放登记" : isAdmin ? "管理员可登记" : "待开票"}
                  </span>
                </div>
                {canBook ? (
                  <PendingLink
                    className="btn show-booking-button"
                    href={`/shows/${show.id}`}
                    pendingLabel="加载中…"
                  >
                    登记本场 <span aria-hidden>→</span>
                  </PendingLink>
                ) : (
                  <button className="btn show-booking-button" disabled>
                    {ticketSaleOpensLabel()} 开票
                  </button>
                )}
              </article>
            ))}
          </div>
        )}

        <VenueMap />
      </section>

      <section className="guide-section" id="guide">
        <div className="section-head">
          <div>
            <p className="eyebrow">Before You Arrive</p>
            <h2>观演须知</h2>
            <p>请预留时间抵达，并配合现场工作人员安排。</p>
          </div>
        </div>
        <div className="guide-grid">
          <article className="guide-item">
            <span>01</span>
            <div>
              <h3>票务与按金</h3>
              <p>{depositGuideCopy()}</p>
            </div>
          </article>
          <article className="guide-item">
            <span>02</span>
            <div>
              <h3>时间与入场</h3>
              <p>演出约 150 分钟（含 10 分钟中场休息），演出语言为普通话。请至少提前 10 分钟抵达完成签到；演出开始后停止检票，迟到观众须按工作人员安排入场，亦可能无法进入原计划区域就座。</p>
            </div>
          </article>
          <article className="guide-item">
            <span>03</span>
            <div>
              <h3>座位安排</h3>
              <p>
                <strong>蝶境区｜沉浸观演区：</strong>
                位于场地中央，演员将在观众身边及区域内表演，适合希望近距离参与故事的观众。
                <br />
                <strong>见证区｜经典观演区：</strong>
                位于场地两侧，保持相对完整的观演视角，适合以传统剧场方式欣赏。两区均自由入座、先到先得。
              </p>
            </div>
          </article>
          <article className="guide-item">
            <span>04</span>
            <div>
              <h3>摄影与沉浸体验</h3>
              <p>可拍照及录影，请关闭闪光灯、补光灯及快门提示音。演员可能从观众席通道及周边经过，请勿触碰演员、道具或舞台设备，并听从工作人员指引。</p>
            </div>
          </article>
          <article className="guide-item">
            <span>05</span>
            <div>
              <h3>年龄提示</h3>
              <p>身高 1.2 米以下儿童谢绝入场，建议 12 岁以上观众观看；未成年人须由监护人陪同。</p>
            </div>
          </article>
          <article className="guide-item">
            <span>06</span>
            <div>
              <h3>入校预约</h3>
              <p>
                演出位于香港中文大学（深圳）校园内，观众需先完成访客入校预约。入校指南暂未开放，开放后将在此提供图文步骤。
              </p>
              {isAdmin ? (
                <p style={{ marginTop: "0.75rem" }}>
                  <Link href="/campus-entry">查看入校预约指南 →</Link>
                </p>
              ) : null}
            </div>
          </article>
        </div>
      </section>

      <footer className="footer-note">
        <span>CU Musical · 香港中文大学音乐剧社</span>
      </footer>
    </main>
  );
}
