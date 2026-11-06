import Link from "next/link";
import { redirect } from "next/navigation";
import { CampusGuideSteps } from "@/components/CampusGuideSteps";
import { SiteHeader } from "@/components/SiteHeader";
import {
  CAMPUS_ENTRY_HIGHLIGHTS,
  CAMPUS_ENTRY_STEPS,
} from "@/lib/campus-entry-guide";
import { createSupabaseServerClient, getSupabaseUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "入校预约填写指南（旧）",
  description: "访客入校预约填写信息与微信小程序步骤（管理员内部参考）",
};

export default async function AdminCampusBookingPage() {
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
        <p className="eyebrow">Admin · Internal</p>
        <h1>入校预约填写指南（旧）</h1>
        <p>
          旧版微信小程序访客预约填写说明，仅供干事内部参考。观众入口已改为「入校扫二维码登记」。
        </p>
        <div className="row" style={{ marginTop: "1.1rem" }}>
          <Link className="btn secondary" href="/campus-entry">
            查看观众入校页
          </Link>
          <Link className="btn secondary" href="/account">
            返回账号
          </Link>
        </div>
      </section>

      <section className="panel campus-entry-summary">
        <h2>请按以下信息填写预约</h2>
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

      <CampusGuideSteps steps={CAMPUS_ENTRY_STEPS} />
    </main>
  );
}
