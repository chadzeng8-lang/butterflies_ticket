import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { PAST_SHOWS, UPCOMING_SHOW_NOTE } from "@/lib/past-shows";

export const metadata = {
  title: "演出",
  description: "学生版《蝶》往期场次与下一站演出资讯",
};

export default function ShowsPage() {
  return (
    <main className="shell home-shell booking-page">
      <SiteHeader />

      <section className="section show-section" id="shows">
        <div className="section-head">
          <div>
            <p className="eyebrow">Performances</p>
            <h1 className="booking-page-title">演出资讯</h1>
            <p>
              安托山与港中深两场演出均已完成。下一站预计 2027 年 3 月在香港中文大学演出。
            </p>
          </div>
        </div>

        <article className="panel upcoming-show-note">
          <p className="eyebrow">{UPCOMING_SHOW_NOTE.title}</p>
          <h2>{UPCOMING_SHOW_NOTE.date}</h2>
          <p>
            <strong>{UPCOMING_SHOW_NOTE.venue}</strong>
          </p>
          <p>{UPCOMING_SHOW_NOTE.summary}</p>
          <p className="muted" style={{ marginTop: "0.85rem" }}>
            往期订单仍可在{" "}
            <Link href="/tickets">票夹</Link> 查询；账号相关请前往{" "}
            <Link href="/account">账号</Link>。
          </p>
        </article>

        <div className="payment-accordion past-shows-accordion">
          {PAST_SHOWS.map((show) => (
            <details className="payment-fold" key={show.id}>
              <summary>
                <span className="payment-fold-title">
                  {show.title}
                  <span className="past-show-status"> · {show.status}</span>
                </span>
                <span className="payment-fold-hint">
                  {show.date} · {show.venue}
                </span>
                <span className="payment-fold-toggle">
                  <span className="payment-fold-closed">展开</span>
                  <span className="payment-fold-open">收起</span>
                </span>
              </summary>
              <div className="payment-fold-body past-show-body">
                <p>{show.summary}</p>
                <ul>
                  {show.details.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
