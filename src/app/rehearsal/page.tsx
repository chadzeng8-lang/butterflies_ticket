import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { REHEARSAL_TIMELINE } from "@/lib/rehearsal";
import { STAGE_ALBUMS } from "@/lib/stage-photos";

export const metadata: Metadata = {
  title: "排演日程",
  description: "学生版《蝶》排演日程与舞台剧照",
};

export default function RehearsalPage() {
  return (
    <main className="shell">
      <SiteHeader />

      <section className="hero">
        <p className="eyebrow">Rehearsal</p>
        <h1>排演日程</h1>
        <nav className="subnav-row" aria-label="本页导航">
          <a href="#timeline">时间线</a>
          <a href="#stage">舞台剧照</a>
        </nav>
      </section>

      <section className="content-section" id="timeline">
        <div className="section-head">
          <div>
            <p className="eyebrow">从选角到开幕</p>
            <h2>排演时间线</h2>
            <p>从选角到港中深沉浸版演出；下一站预计 2027 年 3 月在香港中文大学。</p>
          </div>
        </div>
        <ol className="production-timeline about-timeline">
          {REHEARSAL_TIMELINE.map((item) => (
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

      <section className="content-section" id="stage">
        <div className="section-head">
          <div>
            <p className="eyebrow">On Stage</p>
            <h2>舞台剧照</h2>
          </div>
        </div>
        <div className="stage-album-links">
          {STAGE_ALBUMS.map((album) => (
            <Link className="stage-album-link" href={album.href} key={album.id}>
              <div className="stage-album-thumb">
                <Image
                  src={album.thumb}
                  alt={`${album.title}封面`}
                  width={960}
                  height={640}
                  sizes="(max-width: 720px) 92vw, 420px"
                  loading="lazy"
                />
              </div>
              <div className="stage-album-meta">
                <h3>{album.title}</h3>
                <p>
                  {album.date} · {album.venue}
                </p>
                <span className="stage-album-cta">查看剧照 →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
