import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { StageGallery } from "@/components/StageGallery";
import { depositHeroNote } from "@/lib/pricing-copy";
import { SHOW_AUDIENCE_SUMMARY_LINES } from "@/lib/show-audience";
import { isTicketSaleOpen, ticketSaleOpensLabel } from "@/lib/ticket-sale";

export const revalidate = 300;

const storyParagraphs = [
  "在遥远的「世界尽头」，生活着一群被称为蝶人的族群。他们背负着古老的诅咒，被排斥于主流世界之外，在漫长的漂泊与等待中寻找改变命运的希望。",
  "传说，只要蝶人少女祝英台与人类完成命中注定的婚礼，整个族群便能够摆脱诅咒，迎来梦寐以求的新生。于是，这场婚礼被赋予了超越爱情的意义，承载着所有蝶人的未来与希望。",
  "然而，就在婚礼即将到来之际，一位四处流浪的诗人梁山伯闯入了世界尽头。他带来的并不是答案，而是一连串关于命运、自由与选择的追问。",
  "面对早已安排好的未来，祝英台开始怀疑：成为蝶人们期待的新娘，是否真的能够获得幸福？当个人意愿与整个族群的命运发生冲突时，又该如何抉择？",
];

const cast = [
  ["梁山伯", "徐泽韬"],
  ["祝英台", "潘岑远"],
  ["浪花儿", "李嘉雯"],
  ["老爹", "黄宇峰"],
  ["老醉鬼", "韩文华"],
  ["小女孩", "沈怡和"],
  ["小灰", "刘睿元"],
  ["大笨", "杨佳宜"],
  ["失败", "刘谚熹"],
  ["寂寞", "徐喆"],
  ["劳碌", "李春天"],
  ["木讷", "伍舒琪"],
  ["绝望", "陈柯言"],
  ["粗俗", "曾城"],
];

const crew = [
  ["导演", "曾城"],
  ["助理导演", "郭宣辰、邓清扬、蒋思遥"],
  ["舞台监督", "柏雨辰、刘睿元"],
  ["舞蹈指导", "陈念秋"],
  ["声乐指导", "程佳玥、王之行"],
  ["舞美道具", "曾城、曾懿欣、柏雨辰"],
  ["舞美妆造", "王楷源、程泽宜、张佳彤、徐喆"],
  ["灯光", "王嘉琪、曾城、施涵中"],
  ["音乐制作", "刘睿元、王之行"],
  ["音效执行", "陈念秋、王之行、程泽宜"],
  ["摄影", "张佳彤、王一伊、胡可萱、彭琪淇"],
  ["字幕执行", "曾奕馨、邱心语"],
];

const productionTimeline = [
  {
    date: "2026.04.18–20",
    title: "演员面试",
    description: "进行演员选拔面试，确定主要卡司。",
  },
  {
    date: "2026.05.02",
    title: "剧组破冰",
    description: "导演团队和演员进行首次线下破冰活动，《蝶》剧组正式成立。",
  },
  {
    date: "2026.06-2026.07",
    title: "线上声乐学习与剧本研读",
    description: "演员进行唱段与和声学习，并研读剧本，创作角色小传。",
  },
  {
    date: "2026.07.12",
    title: "受邀参加2026深港澳青年文化交流周收官活动",
    description: "参与《湾区长歌·时光织梦》大湾区高校音乐剧展演",
  },
  {
    date: "2026.08.03",
    title: "受邀参加香港中文大学2026暑期学校荧星晚会",
    description: "表演音乐剧《6个说谎的大学生》歌曲选段《千分之一》。",
  },
  {
    date: "2026.09.06",
    title: "首次线下声乐联排",
    description: "进行线下合唱排练。",
  },
  {
    date: "2026.09中旬",
    title: "幕后人员招募",
    description: "构建完整制作与幕后技术团队。",
  },
  {
    date: "2026.09–2026.10",
    title: "剧目集中排练",
    description: "进行表演及舞蹈训练，打磨整体舞台调度。",
  },
  {
    date: "2026.10.17",
    title: "《蝶》精简版 首演",
    description: "深圳安托山公共文化中心向日葵厅。",
  },
  {
    date: "2026.11.21–22",
    title: "《蝶》沉浸式版 演出",
    description: "香港中文大学（深圳）时光胶囊黑匣子。",
  },
];

export default async function HomePage() {
  // Homepage CTA only needs the sale clock — skip Supabase round-trip on first paint.
  const saleOpen = isTicketSaleOpen();
  const canBook = saleOpen;
  return (
    <main className="shell home-shell">
      <SiteHeader />

      <section className="event-hero" aria-labelledby="event-title">
        <div className="event-poster">
          <Image
            src="/images/butterflies-poster.png"
            alt="音乐剧《蝶》学生版演出海报"
            width={768}
            height={1093}
            sizes="(max-width: 720px) 92vw, 360px"
            quality={72}
            priority
          />
        </div>
        <div className="event-summary">
          <p className="eyebrow">CU Musical · 年度大戏</p>
          <h1 id="event-title">音乐剧《蝶》学生版</h1>
          <p className="event-tagline">爱，是种飞翔的方式。</p>
          <p className="event-intro">
            一个关于爱与斗争、命运与自由的故事。一次来自世界尽头的坚持和选择。
          </p>

          <div className="event-facts">
            <div>
              <span>演出时间</span>
              <strong>2026.11.21 — 11.22</strong>
            </div>
            <div>
              <span>场次说明</span>
              <strong className="event-audience-lines">
                {SHOW_AUDIENCE_SUMMARY_LINES.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </strong>
            </div>
            <div>
              <span>演出地点</span>
              <strong>香港中文大学（深圳）时光胶囊黑匣子</strong>
            </div>
            <div>
              <span>演出语言</span>
              <strong>普通话 · 约 150 分钟（含15min中场休息）</strong>
            </div>
          </div>

          <div className="booking-summary">
            <div>
              <span className="booking-kicker">公益演出</span>
              <strong className="booking-price">免费</strong>
              <span className="booking-note">{depositHeroNote()}</span>
            </div>
            {canBook ? (
              <Link className="btn booking-button" href="/shows">
                立即登记 <span aria-hidden>→</span>
              </Link>
            ) : (
              <button className="btn booking-button" disabled>
                {`${ticketSaleOpensLabel()} 开票`}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="story-section" id="story">
        <div className="story-heading">
          <p className="eyebrow">The Story / 01</p>
          <h2>爱，是种飞翔的方式。</h2>
        </div>
        <div className="story-copy">
          <p className="story-tagline">故事简介</p>
          {storyParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-logo">
          <Image
            src="/images/cu-musical-logo.jpg"
            alt="CU Musical 香港中文大学音乐剧社标志"
            width={768}
            height={768}
            sizes="190px"
            quality={70}
            loading="lazy"
          />
        </div>
        <div className="about-copy">
          <p className="eyebrow">About CU Musical / 02</p>
          <h2>关于我们</h2>
          <p>
            香港中文大学音乐剧社（CU Musical）成立于 2019 年，是香港中文大学最具活力的学生表演艺术团体之一。我们汇聚来自香港本地、大陆内地及国际背景的音乐剧爱好者，致力于打造高质量音乐剧制作，推动校园艺术发展与大湾区高校文化交流。
          </p>
          <p>
            近年来，社团先后制作《Into the Woods》《Lizzie》等大型音乐剧作品，并举办 Gala Night 音乐剧晚会、音乐剧工作坊及跨校交流活动，持续为学生提供专业化、多元化的表演艺术平台。
          </p>
        </div>
      </section>

      <section className="gallery-section" aria-label="演出剧照">
        <div className="gallery-heading">
          <div>
            <p className="eyebrow">On Stage / 03</p>
            <h2>来自世界尽头的相遇</h2>
          </div>
          <p>记录《蝶》一路走来的每一步。</p>
        </div>
        <StageGallery />
        <ol className="production-timeline">
          {productionTimeline.map((item) => (
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

      <section className="credits-section" id="credits">
        <div className="section-head">
          <div>
            <p className="eyebrow">Company / 04</p>
            <h2>本轮演出演职人员</h2>
          </div>
        </div>
        <div className="credits-grid">
          <div className="credits-group">
            <h3>演员 Cast</h3>
            <dl className="credits-list">
              {cast.map(([role, name]) => (
                <div key={role}><dt>{role}</dt><dd>{name}</dd></div>
              ))}
            </dl>
          </div>
          <div className="credits-group">
            <h3>制作团队 Production</h3>
            <dl className="credits-list">
              {crew.map(([role, name]) => (
                <div key={role}><dt>{role}</dt><dd>{name}</dd></div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="credits-section" id="personality" aria-labelledby="personality-title">
  <div className="section-head">
    <div>
      <p className="eyebrow">Personality Quiz / 05</p>
      <h2 id="personality-title">测测你是《蝶》里的哪个人</h2>
    </div>
  </div>
 <Link className="btn" href="/personality">
    开始测试 <span aria-hidden>→</span>
  </Link>
</section>
      <section className="closing-cta">
        <p className="eyebrow">CU Musical · 2026</p>
        <h2>一场婚礼，<br />一个族群的命运。<br />等你走进《蝶》的世界。</h2>
        {canBook ? (
          <Link className="btn" href="/shows">选择场次并登记 <span aria-hidden>→</span></Link>
        ) : (
          <button className="btn" disabled>
            {`${ticketSaleOpensLabel()} 开票`}
          </button>
        )}
      </section>

    </main>
  );
}
