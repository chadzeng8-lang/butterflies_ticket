import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import {
  CAMPUS_ENTRY_HIGHLIGHTS,
  CAMPUS_ENTRY_STEPS,
} from "@/lib/campus-entry-guide";

export const dynamic = "force-static";

export const metadata = {
  title: "入校预约指南",
  description: "香港中文大学（深圳）访客入校预约图文指南 · 《蝶》观众专用",
};

export default function CampusEntryPage() {
  return (
    <main className="shell shell-narrow">
      <SiteHeader />

      <section className="hero">
        <p className="eyebrow">Campus Entry</p>
        <h1>入校预约指南</h1>
        <p>
          演出地点位于香港中文大学（深圳）校园内。观众需先通过微信小程序完成访客入校预约，再按审批结果入校观演。
        </p>
      </section>

      <section className="panel campus-entry-summary">
        <h2>请按以下信息填写</h2>
        <p className="muted">被访人信息请勿自行更改，以免影响审核。</p>
        <dl className="campus-entry-highlights">
          {CAMPUS_ENTRY_HIGHLIGHTS.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="campus-entry-steps">
        {CAMPUS_ENTRY_STEPS.map((step, index) => (
          <article key={step.image} className="campus-entry-step">
            <div className="campus-entry-step-copy">
              <span className="campus-entry-step-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
              {step.tips && step.tips.length > 0 && (
                <ul className="campus-entry-tips">
                  {step.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              )}
            </div>
            <figure className="campus-entry-figure">
              <Image
                src={step.image}
                alt={`步骤 ${index + 1}：${step.title}`}
                width={780}
                height={1680}
                className="campus-entry-image"
                sizes="(max-width: 720px) 100vw, 420px"
              />
            </figure>
          </article>
        ))}
      </section>

      <section className="panel">
        <h2>温馨提示</h2>
        <div className="meta">
          <span>建议提前完成预约，并留意短信与小程序中的审批结果。</span>
          <span>
            也可在网页查询：{" "}
            <a
              href="https://visitcampus.cuhk.edu.cn/h5/admission-tours-q"
              target="_blank"
              rel="noreferrer"
            >
              visitcampus.cuhk.edu.cn
            </a>
          </span>
          <span>若演出当天仍未审核通过，请及时联系主办方。</span>
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
