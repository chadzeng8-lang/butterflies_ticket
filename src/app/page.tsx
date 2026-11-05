import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { listSupabaseShows } from "@/lib/supabase/shows";
import { formatShowTime } from "@/lib/format";
import { centsToCny } from "@/lib/money";
import { audiencePricingSummary } from "@/lib/pricing-copy";

export const dynamic = "force-dynamic";

const storyParagraphs = [
  "在遙遠的「世界盡頭」，生活著一群被稱為蝶人的族群。他們背負著古老的詛咒，被排斥於主流世界之外，在漫長的漂泊與等待中尋找改變命運的希望。",
  "傳說，只要蝶人少女祝英台與人類完成命中註定的婚禮，整個族群便能夠擺脫詛咒，迎來夢寐以求的新生。於是，這場婚禮被賦予了超越愛情的意義，承載著所有蝶人的未來與希望。",
  "然而，就在婚禮即將到來之際，一位四處流浪的詩人梁山伯闖入了世界盡頭。他帶來的並不是答案，而是一連串關於命運、自由與選擇的追問。面對早已安排好的未來，祝英台開始懷疑：成為別人期待的樣子，是否真的能夠獲得幸福？當個人意願與整個族群的命運發生衝突時，又該如何抉擇？",
];

const cast = [
  ["梁山伯", "徐澤韜"],
  ["祝英台", "潘岑遠"],
  ["浪花兒", "李嘉雯"],
  ["老爹", "黃宇峰"],
  ["老醉鬼", "韓文華"],
  ["小女孩", "沈怡和"],
  ["小灰", "劉睿元"],
  ["大笨", "楊佳宜"],
  ["失敗", "劉諺熹"],
  ["寂寞", "徐喆"],
  ["勞碌", "李春天"],
  ["木訥", "伍舒琪"],
  ["絕望", "陳柯言"],
  ["粗俗", "曾城"],
];

const crew = [
  ["導演", "曾城"],
  ["助導", "郭宣辰、鄧清揚、蒋思遥"],
  ["舞監", "柏雨辰"],
  ["舞蹈指導", "陳念秋"],
  ["舞美道具", "曾城、曾懿欣、柏雨辰"],
  ["舞美妝造", "王楷源、程澤宜、張佳彤、徐喆"],
  ["燈光", "王嘉琪、曾城、施涵中"],
  ["音效", "劉睿元、王之行、程澤宜、陳念秋、徐喆"],
  ["攝影", "張佳彤、王一伊、胡可萱、彭琪淇"],
  ["字幕", "曾奕馨、邱心语"],
];

const productionTimeline = [
  {
    date: "2026.04.18–20",
    title: "演员面试",
    description: "确定主要卡司，完成演员团队构建。",
  },
  {
    date: "2026.05.02",
    title: "演员破冰",
    description: "相互熟悉，建立团队默契。",
  },
  {
    date: "2026.06.08",
    title: "开始声乐学习与剧本研读",
    description: "为唱段打底，创作角色小传。",
  },
  {
    date: "2026.07.12",
    title: "参加《湾区长歌·时光织梦》大湾区高校音乐剧展演",
    description: "选段首秀，首次面对观众。",
  },
  {
    date: "2026.08.03",
    title: "参加香港中文大学荧星晚会",
    description: "演出《千分之一》，宣传中国音乐剧。",
  },
  {
    date: "2026.09.06",
    title: "第一次排练",
    description: "从场面调度与熟悉声乐开始。",
  },
  {
    date: "2026.09中旬",
    title: "幕后招募",
    description: "构建完整制作与技术团队。",
  },
  {
    date: "2026.09–10",
    title: "剧目集中排练",
    description: "打磨表演、声乐、舞蹈与舞台调度。",
  },
  {
    date: "2026.10.17",
    title: "《蝶》精简版首演",
    description: "深圳安托山公共文化中心向日葵厅。",
  },
  {
    date: "2026.11.21–22",
    title: "《蝶》沉浸式版",
    description: "香港中文大学（深圳）时光胶囊黑匣子。",
  },
];

export default async function HomePage() {
  const shows = await listSupabaseShows(false);
  const firstOpen = shows[0];
  const featuredShow = shows[0];

  return (
    <main className="shell home-shell">
      <SiteHeader />

      <section className="event-hero" aria-labelledby="event-title">
        <div className="event-poster">
          <Image
            src="/images/butterflies-poster.png"
            alt="音樂劇《蝶》學生版演出海報"
            width={768}
            height={1093}
            priority
          />
        </div>
        <div className="event-summary">
          <p className="eyebrow">CU Musical · 2027 年度大戲</p>
          <h1 id="event-title">音樂劇《蝶》學生版</h1>
          <p className="event-tagline">愛，是種飛翔的方式。</p>
          <p className="event-intro">
            一場關於愛與鬥爭、命運與自由的沉浸式音樂劇。來自世界盡頭的蝴蝶，即將再次振翅。
          </p>

          <div className="event-facts">
            <div>
              <span>演出時間</span>
              <strong>2026.11.21 — 11.22</strong>
            </div>
            <div>
              <span>演出地點</span>
              <strong>香港中文大學（深圳）時光膠囊黑匣子</strong>
            </div>
            <div>
              <span>演出語言</span>
              <strong>普通話 · 約 150 分鐘（含中場休息）</strong>
            </div>
          </div>

          <div className="booking-summary">
            <div>
              <span className="booking-kicker">公益演出</span>
              <strong className="booking-price">免費</strong>
              <span className="booking-note">
                每張票需繳 {centsToCny(featuredShow?.depositCents ?? 5000)} 按金，到場觀演後全額退還
              </span>
            </div>
            {firstOpen ? (
              <Link className="btn booking-button" href={`/shows/${firstOpen.id}`}>
                立即登記 <span aria-hidden>→</span>
              </Link>
            ) : (
              <button className="btn booking-button" disabled>
                暫無餘席
              </button>
            )}
          </div>
          <Link className="ticket-lookup-link" href="/tickets">
            已有訂單？查詢電子票 <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <section className="section show-section" id="shows">
        <div className="section-head">
          <div>
            <p className="eyebrow">Performance / 01</p>
            <h2>選擇場次</h2>
            <p>座位有限，登記完成後請按訂單指引支付按金。</p>
          </div>
        </div>

        {shows.length === 0 ? (
          <div className="panel muted">暫無開售場次，請稍後再來。</div>
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
                    <span className="badge">開放登記</span>
                  </div>
                  <Link className="btn show-booking-button" href={`/shows/${show.id}`}>
                    登記本場 <span aria-hidden>→</span>
                  </Link>
                </article>
            ))}
          </div>
        )}
      </section>

      <section className="story-section" id="story">
        <div className="story-heading">
          <p className="eyebrow">The Story / 02</p>
          <h2>愛，是種飛翔的方式。</h2>
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
          />
        </div>
        <div className="about-copy">
          <p className="eyebrow">About CU Musical / 03</p>
          <h2>关于我们</h2>
          <p>
            香港中文大學音樂劇社（CU Musical）成立於 2019 年，是香港中文大學最具活力的學生表演藝術團體之一。我們匯聚來自香港、本地、內地及國際背景的音樂劇愛好者，致力於打造高質量音樂劇製作，推動校園藝術發展與大灣區高校文化交流。
          </p>
          <p>
            近年來，社團先後製作《Into the Woods》《Lizzie》等大型音樂劇作品，並舉辦 Gala Night 音樂劇晚會、音樂劇工作坊及跨校交流活動，持續為學生提供專業化、多元化的表演藝術平台。
          </p>
        </div>
      </section>

      <section className="gallery-section" aria-label="演出劇照">
        <div className="gallery-heading">
          <div>
            <p className="eyebrow">On Stage / 04</p>
            <h2>來自世界盡頭的相遇</h2>
          </div>
          <p>從初次相遇到沉浸式舞台，記錄《蝶》一路走來的每一步。</p>
        </div>
        <div className="photo-gallery">
          <figure className="gallery-photo">
            <Image src="/images/butterflies-still-2.jpg" alt="梁山伯與祝英台的舞台劇照" fill sizes="(max-width: 640px) 100vw, 33vw" />
          </figure>
          <figure className="gallery-photo">
            <Image src="/images/butterflies-still-1.jpg" alt="音樂劇《蝶》雙人舞台劇照" fill sizes="(max-width: 640px) 50vw, 33vw" />
          </figure>
          <figure className="gallery-photo">
            <Image src="/images/butterflies-still-3.jpg" alt="音樂劇《蝶》群像舞台劇照" fill sizes="(max-width: 640px) 50vw, 33vw" />
          </figure>
        </div>
        <div className="gallery-premiere">
          <span>2026.10.17 · 深圳安托山公共文化中心向日葵厅</span>
          <p>《蝶》精簡版於此首演。11 月 21 日至 22 日，與更多觀眾再次相見。</p>
        </div>
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
            <p className="eyebrow">Company / 05</p>
            <h2>演職人員</h2>
            <p>每一次振翅，都來自台前幕後共同的努力。</p>
          </div>
        </div>
        <div className="credits-grid">
          <div className="credits-group">
            <h3>演員 Cast</h3>
            <dl className="credits-list">
              {cast.map(([role, name]) => (
                <div key={role}><dt>{role}</dt><dd>{name}</dd></div>
              ))}
            </dl>
          </div>
          <div className="credits-group">
            <h3>製作團隊 Production</h3>
            <dl className="credits-list">
              {crew.map(([role, name]) => (
                <div key={role}><dt>{role}</dt><dd>{name}</dd></div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="guide-section" id="guide">
        <div className="section-head">
          <div>
            <p className="eyebrow">Before You Arrive / 06</p>
            <h2>觀演須知</h2>
            <p>請預留時間抵達，並配合現場工作人員安排。</p>
          </div>
        </div>
        <div className="guide-grid">
          <article className="guide-item">
            <span>01</span>
            <div>
              <h3>票務與按金</h3>
              <p>本場為公益演出，門票免費。每張門票需繳納人民幣 50 元按金；演出當天完成簽到並到場觀演後，按金將原路全額退還。</p>
            </div>
          </article>
          <article className="guide-item">
            <span>02</span>
            <div>
              <h3>時間與入場</h3>
              <p>演出約 150 分鐘（含 10 分鐘中場休息），演出語言為普通話。請至少提前 10 分鐘抵達完成簽到；演出開始後停止檢票，遲到觀眾須按工作人員安排入場，亦可能無法進入原計劃區域就座。</p>
            </div>
          </article>
          <article className="guide-item">
            <span>03</span>
            <div>
              <h3>座位安排</h3>
              <p><strong>蝶境區｜沉浸觀演區：</strong>位於場地中央，演員將在觀眾身邊及區域內表演，適合希望近距離參與故事的觀眾。<br /><strong>見證區｜經典觀演區：</strong>位於場地兩側，保持相對完整的觀演視角，適合以傳統劇場方式欣賞。兩區均自由入座、先到先得。</p>
            </div>
          </article>
          <article className="guide-item">
            <span>04</span>
            <div>
              <h3>攝影與沉浸體驗</h3>
              <p>可拍照及錄影，請關閉閃光燈、補光燈及快門提示音。演員可能從觀眾席通道及周邊經過，請勿觸碰演員、道具或舞台設備，並聽從工作人員指引。</p>
            </div>
          </article>
          <article className="guide-item">
            <span>05</span>
            <div>
              <h3>年齡提示</h3>
              <p>身高 1.2 米以下兒童謝絕入場，建議 12 歲以上觀眾觀看；未成年人須由監護人陪同。</p>
            </div>
          </article>
        </div>
      </section>

      <section className="closing-cta">
        <p className="eyebrow">CU Musical · 2026</p>
        <h2>一場婚禮，一個族群的命運。<br />等你走進《蝶》的世界。</h2>
        <Link className="ticket-lookup-link" href="/personality">
          测测你是《蝶》里的哪个人 <span aria-hidden>→</span>
        </Link>
        {firstOpen ? (
          <Link className="btn" href={`/shows/${firstOpen.id}`}>選擇場次並登記 <span aria-hidden>→</span></Link>
        ) : (
          <button className="btn" disabled>暫無餘席</button>
        )}
      </section>

      <footer className="footer-note">
        <span>CU Musical · 香港中文大學音樂劇社</span>
        <span>轉賬請備註訂單號</span>
      </footer>
    </main>
  );
}
