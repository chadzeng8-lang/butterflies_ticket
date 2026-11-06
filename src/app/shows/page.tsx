import Link from "next/link";
import { AdminOnly } from "@/components/AdminOnly";
import { ShowsBookingPanel } from "@/components/ShowsBookingPanel";
import { SiteHeader } from "@/components/SiteHeader";
import { VenueMap } from "@/components/VenueMap";
import { listSupabaseShows } from "@/lib/supabase/shows";
import { depositGuideCopy } from "@/lib/pricing-copy";
import {
  SHOW_AUDIENCE_CUHK,
  SHOW_AUDIENCE_PUBLIC,
} from "@/lib/show-audience";
import { isTicketSaleOpen } from "@/lib/ticket-sale";

export const revalidate = 120;

export default async function ShowsPage() {
  const shows = await listSupabaseShows(false);
  const saleOpen = isTicketSaleOpen();

  return (
    <main className="shell home-shell">
      <SiteHeader />

      <section className="section show-section" id="shows">
        <div className="section-head">
          <div>
            <p className="eyebrow">Tickets / Booking</p>
            <h2>报名与购票</h2>
            <p>请按顺序完成以下三步，即可顺利入场观演。</p>
          </div>
        </div>

        <ShowsBookingPanel shows={shows} saleOpen={saleOpen} />

        <VenueMap />
      </section>

      <section className="guide-section" id="guide">
        <div className="section-head">
          <div>
            <p className="eyebrow">Before You Arrive</p>
            <h2>观演须知</h2>
            <p>请预留时间抵达，并配合现场工作人员安排。</p>
          </div>
        </div>
        <div className="guide-grid">
          <article className="guide-item">
            <span>01</span>
            <div>
              <h3>票务与按金</h3>
              <p>{depositGuideCopy()}</p>
            </div>
          </article>
          <article className="guide-item">
            <span>02</span>
            <div>
              <h3>时间与入场</h3>
              <p>演出约 150 分钟（含 10 分钟中场休息），演出语言为普通话。演出开始前20分钟开始入场；迟到观众须按工作人员安排入场，亦可能无法进入原计划区域就座。</p>
            </div>
          </article>
          <article className="guide-item">
            <span>03</span>
            <div>
              <h3>场次开放对象</h3>
              <p>
                <strong>11 月 21 日：</strong>
                <span className="show-audience">{SHOW_AUDIENCE_PUBLIC}</span>。
                <br />
                <strong>11 月 22 日：</strong>
                <span className="show-audience">{SHOW_AUDIENCE_CUHK}</span>。
              </p>
            </div>
          </article>
          <article className="guide-item">
            <span>04</span>
            <div>
              <h3>座位安排（自由入座、先到先得）</h3>
              <p>
                <strong>蝶境区｜沉浸观演区：</strong>
                位于场地中央，演员将在观众身边及区域内表演，适合希望近距离参与故事的观众。
                <br />
                <strong>见证区｜经典观演区：</strong>
                位于场地两侧，保持相对完整的观演视角，适合以传统剧场方式欣赏。两区均自由入座、先到先得。
              </p>
            </div>
          </article>
          <article className="guide-item">
            <span>05</span>
            <div>
              <h3>摄影与沉浸体验</h3>
              <p>可拍照及录影，请关闭闪光灯、补光灯及快门提示音。演员可能从观众席通道及周边经过，请勿触碰演员、道具或舞台设备，并听从工作人员指引。</p>
            </div>
          </article>
          <article className="guide-item">
            <span>06</span>
            <div>
              <h3>年龄提示</h3>
              <p>身高 1.2 米以下儿童谢绝入场，建议 12 岁以上观众观看；未成年人须由监护人陪同。</p>
            </div>
          </article>
          <article className="guide-item">
            <span>07</span>
            <div>
              <h3>入校预约</h3>
              <p>
                演出位于香港中文大学（深圳）校园内，观众需先完成访客入校预约。入校指南暂未开放，开放后将在此提供图文步骤。
              </p>
              <AdminOnly>
                <p style={{ marginTop: "0.75rem" }}>
                  <Link href="/campus-entry">查看入校预约指南 →</Link>
                </p>
              </AdminOnly>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
