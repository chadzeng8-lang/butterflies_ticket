import Link from "next/link";
import { CampusGuideSteps } from "@/components/CampusGuideSteps";
import { SiteHeader } from "@/components/SiteHeader";
import {
  CAMPUS_ROUTE_META,
  CAMPUS_ROUTE_STEPS,
} from "@/lib/campus-entry-guide";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "入校指南",
  description: "香港中文大学（深圳）入校扫码登记与到场路线 · 《蝶》观众专用",
};

export default function CampusEntryPage() {
  return (
    <main className="shell shell-narrow">
      <SiteHeader />

      <section className="hero">
        <h1>入校指南</h1>
      </section>

      <section className="panel campus-entry-summary">
        <h2>扫码登记</h2>
        <p className="muted">请使用微信扫描下方二维码完成入校登记。</p>
        <div className="campus-entry-qr-placeholder" aria-live="polite">
          <span className="campus-entry-qr-box" aria-hidden />
          <p className="notice">二维码暂未开放，开放后将在此展示。</p>
        </div>
      </section>

      <section className="panel campus-entry-summary">
        <h2>{CAMPUS_ROUTE_META.title}</h2>
        <p className="muted">登记完成后，可按下列实景路线前往剧场。</p>
        <dl className="campus-entry-highlights">
          <div>
            <dt>剧场位置</dt>
            <dd>{CAMPUS_ROUTE_META.venue}</dd>
          </div>
        </dl>
      </section>

      <CampusGuideSteps
        steps={CAMPUS_ROUTE_STEPS}
        imageClassName="campus-entry-image campus-entry-route-image"
      />

      <section className="panel">
        <h2>温馨提示</h2>
        <div className="meta">
          <span>入校登记二维码开放后，请提前完成扫码登记。</span>
          <span>入校时请按现场要求出示登记凭证；私家车不能入校。</span>
          <span>如有疑问，请及时联系主办方。</span>
        </div>
        <div className="row" style={{ marginTop: "1.1rem" }}>
          <Link className="btn" href="/shows">
            返回选场次
          </Link>
          <Link className="btn secondary" href="/tickets">
            我的票夹
          </Link>
        </div>
      </section>
    </main>
  );
}
