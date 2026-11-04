import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { SiteHeader } from "@/components/SiteHeader";
import { isAdminAuthenticated } from "@/lib/auth";
import { getRemainingSeats, listOrders, listShows, seedDemoShowIfEmpty } from "@/lib/db";
import { centsToCny } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  seedDemoShowIfEmpty();
  const shows = listShows(true);
  const pending = listOrders({ status: "pending_confirm" });
  const issued = listOrders({ status: "issued" });

  return (
    <main className="shell">
      <SiteHeader />
      <section className="hero">
        <h1>干事后台</h1>
        <p>核对转账备注订单号 → 确认出票 → 现场扫码退按金。</p>
      </section>
      <AdminNav />
      <div className="grid">
        <article className="card">
          <h2>待确认收款</h2>
          <p className="price" style={{ fontSize: "2rem", margin: "0.4rem 0" }}>
            {pending.length}
          </p>
          <Link className="btn" href="/admin/orders?status=pending_confirm">
            去对账
          </Link>
        </article>
        <article className="card">
          <h2>已出票未核销订单</h2>
          <p className="price" style={{ fontSize: "2rem", margin: "0.4rem 0" }}>
            {issued.length}
          </p>
          <Link className="btn secondary" href="/admin/checkin">
            打开现场核销
          </Link>
        </article>
        <article className="card">
          <h2>场次库存</h2>
          <div className="meta" style={{ marginTop: "0.6rem" }}>
            {shows.map((s) => (
              <span key={s.id}>
                {s.title} · 余 {getRemainingSeats(s)}/{s.capacity} · 票价{" "}
                {centsToCny(s.ticketPriceCents)} + 按金 {centsToCny(s.depositCents)}
                {!s.onSale ? " · 停售" : ""}
              </span>
            ))}
            {shows.length === 0 && <span>暂无场次</span>}
          </div>
          <div style={{ marginTop: "0.9rem" }}>
            <Link href="/admin/shows">管理场次</Link>
          </div>
        </article>
      </div>
    </main>
  );
}
