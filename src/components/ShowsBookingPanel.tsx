"use client";

import Link from "next/link";
import { PendingLink } from "@/components/PendingLink";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { formatShowTime } from "@/lib/format";
import { audiencePricingSummary, depositHeroNote } from "@/lib/pricing-copy";
import { showAudienceLabel } from "@/lib/show-audience";
import {
  ticketSaleClosedMessage,
  ticketSaleOpensLabel,
} from "@/lib/ticket-sale";
import type { Show } from "@/lib/types";

export function ShowsBookingPanel({
  shows,
  saleOpen,
}: {
  shows: Show[];
  saleOpen: boolean;
}) {
  const isAdmin = useIsAdmin();
  const firstOpen = shows[0];
  const canBook = Boolean(firstOpen) && (saleOpen || isAdmin);

  return (
    <>
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
            <Link href="/campus-entry">入校登记</Link>
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
        票务查询 <span aria-hidden>→</span>
      </PendingLink>

      <div className="booking-shows-head" id="show-list">
        <h3>选择场次</h3>
        <p>座位有限，登记完成后请按订单指引支付按金。</p>
      </div>

      {shows.length === 0 ? (
        <div className="panel muted">暂无开售场次，请稍后再来。</div>
      ) : (
        <div className="show-list">
          {shows.map((show) => {
            const audience = showAudienceLabel(show.startsAt);
            return (
              <article key={show.id} className="show-row">
                <div className="show-date">
                  <h3>{formatShowTime(show.startsAt)}</h3>
                  <div className="meta">
                    {audience ? (
                      <span className="show-audience">{audience}</span>
                    ) : null}
                    <span>{show.venue}</span>
                    <span className="price">
                      {audiencePricingSummary(
                        show.ticketPriceCents,
                        show.depositCents,
                      )}
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
            );
          })}
        </div>
      )}
    </>
  );
}
