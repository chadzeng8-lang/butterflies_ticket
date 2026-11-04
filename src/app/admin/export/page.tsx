import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { SiteHeader } from "@/components/SiteHeader";
import { isAdminAuthenticated } from "@/lib/auth";
import { listShows } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminExportPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const shows = listShows(true);

  return (
    <main className="shell">
      <SiteHeader />
      <section className="hero">
        <h1>导出名单</h1>
        <p>下载 CSV，方便现场点名与按金清点。</p>
      </section>
      <AdminNav />
      <div className="grid">
        {shows.map((show) => (
          <article key={show.id} className="card">
            <h2>{show.title}</h2>
            <div className="row" style={{ marginTop: "0.8rem" }}>
              <a className="btn" href={`/admin/export/csv?showId=${show.id}&kind=all`}>
                全部有效订单
              </a>
              <a
                className="btn secondary"
                href={`/admin/export/csv?showId=${show.id}&kind=unchecked`}
              >
                未核销
              </a>
              <a
                className="btn secondary"
                href={`/admin/export/csv?showId=${show.id}&kind=deposit`}
              >
                按金应退清单
              </a>
            </div>
          </article>
        ))}
        {shows.length === 0 && <div className="card muted">暂无场次可导出。</div>}
      </div>
    </main>
  );
}
