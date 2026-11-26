import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export const revalidate = 300;

export default function HomePage() {
  return (
    <main className="shell home-shell">
      <SiteHeader />

      <section className="event-hero" aria-labelledby="event-title">
        <div className="event-poster">
          <Image
            src="/images/butterflies-poster.jpg"
            alt="音乐剧《蝶》学生版演出海报"
            width={768}
            height={1093}
            sizes="(max-width: 720px) 92vw, 360px"
            quality={72}
            priority
          />
        </div>
        <div className="event-summary">
          <p className="eyebrow">CU Musical · 学生版《蝶》</p>
          <h1 id="event-title">音乐剧《蝶》学生版</h1>
          <p className="event-tagline">爱，是种飞翔的方式。</p>
          <p className="event-intro">
            一个关于爱与斗争、命运与自由的故事。一次来自世界尽头的坚持和选择。
          </p>

          <div className="event-facts">
            <div>
              <span>往期演出</span>
              <strong>安托山 · 港中深（均已完成）</strong>
            </div>
            <div>
              <span>下一站</span>
              <strong>预计 2027 年 3 月 · 香港中文大学</strong>
            </div>
            <div>
              <span>演出语言</span>
              <strong>普通话 · 约 150 分钟</strong>
            </div>
            <div>
              <span>主办</span>
              <strong>香港中文大学音乐剧社</strong>
            </div>
          </div>

        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-logo" style={{ borderRadius: "12px", overflow: "hidden" }}>
          <Image
            src="/images/cu-musical-logo.jpg"
            alt="CU Musical 香港中文大学音乐剧社标志"
            width={768}
            height={768}
            sizes="190px"
            unoptimized
            loading="eager"
          />
        </div>
        <div className="about-copy">
          <p className="eyebrow">About CU Musical / 01</p>
          <h2>关于我们</h2>
          <p>
            香港中文大学音乐剧社（CU Musical）成立于 2019 年，是香港中文大学最具活力的学生表演艺术团体之一。我们汇聚来自香港本地、大陆内地及国际背景的音乐剧爱好者，致力于打造高质量音乐剧制作，推动校园艺术发展与大湾区高校文化交流。
          </p>
          <p>
            近年来，社团先后制作《Into the Woods》《Lizzie》等大型音乐剧作品，并举办 Gala Night 音乐剧晚会、音乐剧工作坊及跨校交流活动，持续为学生提供专业化、多元化的表演艺术平台。
          </p>
        </div>
      </section>

      <section className="explore-section" id="explore" aria-labelledby="explore-title">
        <div className="section-head">
          <div>
            <p className="eyebrow">Explore / 02</p>
            <h2 id="explore-title">深入《蝶》的世界</h2>
          </div>
        </div>
        <div className="explore-grid">
          <Link className="explore-card" href="/about">
            <span>关于《蝶》</span>
            <strong>缘起、故事与校园版本</strong>
          </Link>
          <Link className="explore-card" href="/script">
            <span>剧情</span>
            <strong>世界观 · 人物 · 歌词</strong>
          </Link>
          <Link className="explore-card" href="/characters">
            <span>人物小传</span>
            <strong>角色设定与内心冲突</strong>
          </Link>
          <Link className="explore-card" href="/rehearsal">
            <span>排演日程</span>
            <strong>时间线与舞台剧照</strong>
          </Link>
          <Link className="explore-card" href="/cast">
            <span>演出卡司</span>
            <strong>主演、群像与制作团队</strong>
          </Link>
          <Link className="explore-card" href="/lyrics">
            <span>歌词</span>
            <strong>剧本唱段全文</strong>
          </Link>
          <Link className="explore-card" href="/personality">
            <span>人格测试</span>
            <strong>测测你是《蝶》里的哪个人</strong>
          </Link>
          <Link className="explore-card" href="/shows">
            <span>演出</span>
            <strong>往期场次与下一站</strong>
          </Link>
        </div>
      </section>

      <section className="closing-cta">
        <p className="eyebrow">CU Musical · 下一站</p>
        <h2>
          <span className="closing-intro">安托山与港中深场次已落下帷幕。</span>
          <span className="closing-line">预计 2027 年 3 月，香港中文大学见。</span>
        </h2>
        <Link className="btn" href="/shows">
          查看演出资讯 <span aria-hidden>→</span>
        </Link>
      </section>
    </main>
  );
}
