import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import {
  ABOUT_CUMUSICAL,
  ABOUT_HISTORY,
  ABOUT_OFFICIAL_RECORDINGS,
  ABOUT_ORIGIN,
  ABOUT_STORY,
  ABOUT_SYNOPSIS,
} from "@/lib/about-content";

export const metadata: Metadata = {
  title: "关于《蝶》",
  description:
    "音乐剧《蝶》的创作背景与简史：从梁祝到世界尽头，以及 Cumusical 校园版本的缘起。",
};

export default function AboutPage() {
  return (
    <main className="shell about-page">
      <div className="about-page-bg" aria-hidden="true">
        <Image
          src="/images/story-butterflies.jpg"
          alt=""
          width={1400}
          height={900}
          sizes="(max-width: 960px) 100vw, 960px"
          priority
        />
      </div>

      <div className="about-page-foreground">
      <SiteHeader />

      <div className="about-page-scroll">
        <section className="hero about-page-hero">
          <p className="eyebrow">About</p>
          <h1>关于《蝶》</h1>
          <p className="about-page-tagline">爱，是种飞翔的方式。</p>
          <nav className="subnav-row" aria-label="本页导航">
            <a href="#origin">缘起</a>
            <a href="#history">简史</a>
            <a href="#synopsis">故事简介</a>
            <a href="#story">故事内核</a>
            <a href="#recordings">正版官摄</a>
            <a href="#cumusical">我们的版本</a>
          </nav>
        </section>

        <section className="content-section about-page-panel" id="origin">
          <div className="about-origin-grid">
            <div>
              <div className="section-head">
                <div>
                  <p className="eyebrow">{ABOUT_ORIGIN.eyebrow}</p>
                  <h2>{ABOUT_ORIGIN.title}</h2>
                </div>
              </div>
              <div className="prose-block">
                {ABOUT_ORIGIN.paragraphs.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
            </div>
            <dl className="meta-list">
              {ABOUT_ORIGIN.meta.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="content-section about-page-panel" id="history">
          <div className="section-head">
            <div>
              <p className="eyebrow">Timeline</p>
              <h2>创作与巡演简史</h2>
            </div>
          </div>
          <ol className="production-timeline about-timeline">
            {ABOUT_HISTORY.map((item) => (
              <li className="timeline-item" key={`${item.date}-${item.title}`}>
                <time>{item.date}</time>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="content-section about-page-panel" id="synopsis">
          <div className="section-head">
            <div>
              <p className="eyebrow">Synopsis</p>
              <h2>故事简介</h2>
            </div>
          </div>
          <div className="prose-block">
            {ABOUT_SYNOPSIS.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </section>

        <section className="content-section about-page-panel" id="story">
          <div className="section-head">
            <div>
              <p className="eyebrow">Story</p>
              <h2>故事内核</h2>
            </div>
          </div>
          <div className="prose-block">
            {ABOUT_STORY.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </section>

        <section className="content-section about-page-panel" id="recordings">
          <div className="section-head">
            <div>
              <p className="eyebrow">{ABOUT_OFFICIAL_RECORDINGS.eyebrow}</p>
              <h2>{ABOUT_OFFICIAL_RECORDINGS.title}</h2>
            </div>
          </div>
          <ul className="about-recording-links">
            {ABOUT_OFFICIAL_RECORDINGS.links.map((item) => (
              <li key={item.href}>
                <a href={item.href} target="_blank" rel="noopener noreferrer">
                  <span className="about-recording-title">{item.title}</span>
                  <span className="about-recording-note">{item.note}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="about-recording-source">
            <a
              href={ABOUT_OFFICIAL_RECORDINGS.spaceHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ABOUT_OFFICIAL_RECORDINGS.spaceLabel} →
            </a>
          </p>
        </section>

        <section className="content-section about-page-panel" id="cumusical">
          <div className="section-head">
            <div>
              <p className="eyebrow">{ABOUT_CUMUSICAL.eyebrow}</p>
              <h2>{ABOUT_CUMUSICAL.title}</h2>
              <p>{ABOUT_CUMUSICAL.lead}</p>
            </div>
          </div>
          <div className="prose-block">
            {ABOUT_CUMUSICAL.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          <div className="about-cta">
            <Link className="btn" href="/shows">
              查看演出资讯
            </Link>
            <Link className="btn secondary" href="/script">
              走进剧情
            </Link>
            <Link className="btn secondary" href="/characters">
              人物小传
            </Link>
            <Link className="btn secondary" href="/lyrics">
              歌词
            </Link>
          </div>
        </section>
      </div>
      </div>
    </main>
  );
}
