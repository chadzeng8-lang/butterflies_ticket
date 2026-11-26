import Link from "next/link";
import { redirect } from "next/navigation";
import { CampusGuideSteps } from "@/components/CampusGuideSteps";
import { SiteHeader } from "@/components/SiteHeader";
import { VenueMap } from "@/components/VenueMap";
import {
  CAMPUS_ROUTE_META,
  CAMPUS_ROUTE_STEPS,
} from "@/lib/campus-entry-guide";
import { createSupabaseServerClient, getSupabaseUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "入校指南",
  description: "香港中文大学（深圳）入校预约查询与到场路线 · 管理员内部参考",
};

export default async function CampusEntryPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getSupabaseUser(supabase);
  if (!user) redirect("/account");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error("ADMIN_LOOKUP_FAILED");
  if (profile?.role !== "admin") redirect("/account");

  return (
    <main className="shell shell-narrow">
      <SiteHeader />

      <section className="hero">
        <h1>入校指南</h1>
        <p className="muted">仅管理员可见 · 港中深场次内部参考</p>
      </section>

      <section className="panel campus-entry-summary">
        <h2>入校预约</h2>
        <p>
          <strong>11.21（周六）公众场：</strong>
          观众入校预约由工作人员统一提交，无需自行扫码预约。工作人员提交后，你可通过学校访客系统查询是否预约成功：
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          <a
            className="btn"
            href="https://visitcampus.cuhk.edu.cn/h5/admission-tours-q"
            target="_blank"
            rel="noopener noreferrer"
          >
            查询预约结果
          </a>
        </p>
        <p className="muted" style={{ marginTop: "0.9rem" }}>
          查询页：
          <a
            href="https://visitcampus.cuhk.edu.cn/h5/admission-tours-q"
            target="_blank"
            rel="noopener noreferrer"
          >
            visitcampus.cuhk.edu.cn/h5/admission-tours-q
          </a>
        </p>
        <p className="muted" style={{ marginTop: "0.9rem" }}>
          <strong>11.22（周日）校内场：</strong>
          面向港中大 / 港中深同学及教职工，请按学校日常入校要求携带有效证件或校园卡到场。
        </p>
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
        <div style={{ marginTop: "1rem" }}>
          <VenueMap />
        </div>
      </section>

      <CampusGuideSteps
        steps={CAMPUS_ROUTE_STEPS}
        imageClassName="campus-entry-image campus-entry-route-image"
      />

      <section className="panel">
        <h2>温馨提示</h2>
        <div className="meta">
          <span>
            周六公众场入校预约由工作人员提交；可用上方链接核对是否成功。
          </span>
          <span>入校时请按现场要求出示预约成功凭证或有效证件；私家车不能入校。</span>
          <span>如有疑问，请及时联系主办方。</span>
        </div>
        <div className="row" style={{ marginTop: "1.1rem" }}>
          <Link className="btn" href="/admin/online-orders">
            返回订单管理
          </Link>
          <Link className="btn secondary" href="/admin/campus-booking">
            旧版预约填写指南
          </Link>
        </div>
      </section>
    </main>
  );
}
