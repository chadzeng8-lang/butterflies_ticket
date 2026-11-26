import type { Metadata } from "next";
import { PortraitLightboxButton } from "@/components/PortraitLightbox";
import { SiteHeader } from "@/components/SiteHeader";
import {
  BUTTERFLY_ENSEMBLE,
  BUTTERFLY_PORTRAITS,
  HOME_CREW,
  LEAD_VOICES,
} from "@/lib/production-cast";

export const metadata: Metadata = {
  title: "演出卡司",
  description: "学生版《蝶》主演、群像与制作团队",
};

export default function CastPage() {
  return (
    <main className="shell">
      <SiteHeader />

      <section className="hero">
        <p className="eyebrow">Cast & Company</p>
        <h1>演出卡司</h1>
        <p>本轮学生版《蝶》主演、蝶人角色与幕后团队。名单不断更新中。</p>
      </section>

      <section className="credits-section" id="leads" aria-labelledby="leads-title">
        <div className="section-head">
          <div>
            <p className="eyebrow">Leads</p>
            <h2 id="leads-title">主演</h2>
          </div>
        </div>
        <div className="cast-voice-grid">
          {LEAD_VOICES.map((lead) => (
            <article className="cast-voice-card" key={lead.role}>
              <PortraitLightboxButton
                className="cast-voice-photo"
                sizes="(max-width: 720px) 44vw, 220px"
                portrait={{
                  thumb: lead.photo,
                  full: lead.photoFull,
                  alt: `${lead.role} · ${lead.name}`,
                }}
              />
              <div className="cast-voice-copy">
                <p className="cast-role">{lead.role}</p>
                <h3 className="cast-name">{lead.name}</h3>
                <p className="cast-voice">{lead.voice}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="credits-section" id="ensemble" aria-labelledby="ensemble-title">
        <div className="section-head">
          <div>
            <p className="eyebrow">Ensemble</p>
            <h2 id="ensemble-title">蝶人角色</h2>
            <p>对照定妆照 · 点击可看高清 · 不断更新中</p>
          </div>
        </div>
        <div className="cast-voice-grid">
          {BUTTERFLY_PORTRAITS.map((item) => (
            <article className="cast-voice-card" key={`${item.role}-${item.name}`}>
              <PortraitLightboxButton
                className="cast-voice-photo"
                sizes="(max-width: 720px) 44vw, 220px"
                portrait={{
                  thumb: item.photo,
                  full: item.photoFull,
                  alt: `${item.name} 饰 ${item.role}`,
                }}
              />
              <div className="cast-voice-copy">
                <p className="cast-role">{item.role}</p>
                <h3 className="cast-name">{item.name}</h3>
              </div>
            </article>
          ))}
        </div>
        {BUTTERFLY_ENSEMBLE.length > 0 ? (
          <ul className="butterfly-ensemble-list">
            {BUTTERFLY_ENSEMBLE.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="credits-section" id="crew" aria-labelledby="crew-title">
        <div className="section-head">
          <div>
            <p className="eyebrow">Production</p>
            <h2 id="crew-title">制作团队</h2>
          </div>
        </div>
        <dl className="credits-list cast-ensemble-list">
          {HOME_CREW.map(([role, name]) => (
            <div key={role}>
              <dt>{role}</dt>
              <dd>{name}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
