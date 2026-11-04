import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { CreateShowForm, EditShowForm } from "@/components/ShowEditor";
import { SiteHeader } from "@/components/SiteHeader";
import { isAdminAuthenticated } from "@/lib/auth";
import { getRemainingSeats, listShows } from "@/lib/db";
import { formatShowTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminShowsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const shows = listShows(true);

  return (
    <main className="shell">
      <SiteHeader />
      <section className="hero">
        <h1>场次管理</h1>
        <p>设置容量、票价、按金与收款码。</p>
      </section>
      <AdminNav />
      <div className="grid">
        <article className="card">
          <h2>新建场次</h2>
          <CreateShowForm />
        </article>
        {shows.map((show) => (
          <article key={show.id} className="card">
            <h2>
              #{show.id} {show.title}
            </h2>
            <p className="muted">
              {formatShowTime(show.startsAt)} · 余 {getRemainingSeats(show)}/{show.capacity}
            </p>
            <EditShowForm show={show} />
          </article>
        ))}
      </div>
    </main>
  );
}
