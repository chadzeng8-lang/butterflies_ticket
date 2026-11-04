import Link from "next/link";
import { redirect } from "next/navigation";
import {
  confirmOrderAction,
  rejectOrderAction,
  releaseOrderAction,
} from "@/app/actions/admin";
import { AdminNav } from "@/components/AdminNav";
import { SiteHeader } from "@/components/SiteHeader";
import { isAdminAuthenticated } from "@/lib/auth";
import { listOrders } from "@/lib/db";
import { formatShowTime } from "@/lib/format";
import { centsToCny } from "@/lib/money";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const FILTERS: Array<{ key: string; label: string; status?: OrderStatus }> = [
  { key: "pending_confirm", label: "待确认", status: "pending_confirm" },
  { key: "pending_payment", label: "待付款", status: "pending_payment" },
  { key: "issued", label: "已出票", status: "issued" },
  { key: "all", label: "全部" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const sp = await searchParams;
  const statusKey = sp.status || "pending_confirm";
  const filter = FILTERS.find((f) => f.key === statusKey) || FILTERS[0];
  const orders = listOrders(filter.status ? { status: filter.status } : undefined);

  return (
    <main className="shell">
      <SiteHeader />
      <section className="hero">
        <h1>订单对账</h1>
        <p>核对转账备注是否等于订单号，金额是否匹配后再确认出票。</p>
      </section>
      <AdminNav />
      <div className="row" style={{ marginBottom: "1rem" }}>
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            className={`badge ${statusKey === f.key ? "" : "warn"}`}
            href={f.key === "all" ? "/admin/orders?status=all" : `/admin/orders?status=${f.key}`}
          >
            {f.label}
          </Link>
        ))}
      </div>
      <div className="grid">
        {orders.length === 0 && <div className="card muted">暂无订单。</div>}
        {orders.map((order) => {
          const total = order.ticketTotalCents + order.depositTotalCents;
          return (
            <article key={order.id} className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h2 className="order-code" style={{ fontSize: "1.6rem" }}>
                  {order.code}
                </h2>
                <span className="badge">{ORDER_STATUS_LABEL[order.status]}</span>
              </div>
              <div className="meta" style={{ margin: "0.6rem 0" }}>
                <span>
                  {order.showTitle} · {formatShowTime(order.showStartsAt)}
                </span>
                <span>
                  {order.buyerName} · {order.phone}
                  {order.contactExtra ? ` · ${order.contactExtra}` : ""}
                </span>
                <span>
                  {order.quantity} 张 · 应付 <strong>{centsToCny(total)}</strong>
                  （票 {centsToCny(order.ticketTotalCents)} + 按金{" "}
                  {centsToCny(order.depositTotalCents)}）
                </span>
                <span>下单 {formatShowTime(order.createdAt)}</span>
                {order.adminNote && <span>备注：{order.adminNote}</span>}
              </div>
              {order.paymentProofPath && (
                <p>
                  <a href={`/api/uploads/${order.paymentProofPath}`} target="_blank" rel="noreferrer">
                    查看付款截图
                  </a>
                </p>
              )}
              <div className="row" style={{ marginTop: "0.8rem" }}>
                {order.status === "pending_confirm" && (
                  <>
                    <form action={confirmOrderAction}>
                      <input type="hidden" name="code" value={order.code} />
                      <button className="btn" type="submit">
                        确认收款并出票
                      </button>
                    </form>
                    <form action={rejectOrderAction} className="row">
                      <input type="hidden" name="code" value={order.code} />
                      <input
                        name="reason"
                        placeholder="驳回原因"
                        defaultValue="未到账或金额不符"
                        style={{ minWidth: 160 }}
                      />
                      <button className="btn danger" type="submit">
                        驳回
                      </button>
                    </form>
                  </>
                )}
                {(order.status === "pending_payment" ||
                  order.status === "pending_confirm") && (
                  <form action={releaseOrderAction}>
                    <input type="hidden" name="code" value={order.code} />
                    <button className="btn secondary" type="submit">
                      释放库存
                    </button>
                  </form>
                )}
                <Link href={`/orders/${order.code}`}>观众订单页</Link>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
