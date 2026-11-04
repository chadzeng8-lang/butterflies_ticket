import { redirect } from "next/navigation";
import {
  closeSupabaseOrderAction,
  confirmSupabaseOrderAction,
  sendTicketEmailAction,
} from "@/app/actions/supabase-admin";
import { SiteHeader } from "@/components/SiteHeader";
import {
  createSupabaseServerClient,
  getSupabaseUser,
} from "@/lib/supabase/server";
import { formatShowTime } from "@/lib/format";
import { centsToCny } from "@/lib/money";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type OnlineOrder = {
  id: number;
  code: string;
  show_id: number;
  buyer_name: string;
  phone: string;
  contact_extra: string;
  quantity: number;
  ticket_total_cents: number;
  deposit_total_cents: number;
  status: OrderStatus;
  payment_proof_path: string | null;
  email_sent_at: string | null;
  admin_note: string;
  created_at: string;
};

type OnlineShow = {
  id: number;
  title: string;
  starts_at: string;
  venue: string;
};

export default async function OnlineOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const user = await getSupabaseUser(supabase);
  if (!user) redirect("/account");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) throw new Error("ADMIN_LOOKUP_FAILED");
  if (profile?.role !== "admin") redirect("/account");

  const params = await searchParams;
  const { data: orderData, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (ordersError) throw new Error("SUPABASE_ORDER_LOOKUP_FAILED");

  const orders = orderData as OnlineOrder[];
  const showsById = new Map<number, OnlineShow>();
  const { data: showData, error: showsError } = await supabase
    .from("shows")
    .select("id, title, starts_at, venue");
  if (showsError) throw new Error("SUPABASE_SHOW_LOOKUP_FAILED");
  for (const show of showData as OnlineShow[]) showsById.set(show.id, show);

  const proofUrls = new Map<number, string>();
  await Promise.all(
    orders.map(async (order) => {
      if (!order.payment_proof_path) return;
      const { data, error } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(order.payment_proof_path, 60);
      if (error) throw new Error("PAYMENT_PROOF_URL_FAILED");
      proofUrls.set(order.id, data.signedUrl);
    })
  );

  return (
    <main className="shell">
      <SiteHeader />
      <section className="hero">
        <h1>Supabase 在线订单</h1>
        <p>使用已提升为管理员的电邮账号审核新订单。确认后会创建电子票。</p>
      </section>
      {params.error && (
        <div className="error" role="alert">
          {params.error === "email"
            ? "订单已出票或邮件发送失败；请检查邮件配置后重试发送。"
            : "操作失败，订单状态可能已变更；请刷新后重新核对。"}
        </div>
      )}
      {params.done && (
        <div className="success" role="status">
          {params.done === "email" ? "出票邮件已发送。" : "订单状态已更新。"}
        </div>
      )}
      {orders.length === 0 ? (
        <div className="panel muted">目前没有在线订单。</div>
      ) : (
        <div className="grid">
          {orders.map((order) => {
            const show = showsById.get(order.show_id);
            return (
              <article className="card" key={order.id}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <h2 className="order-code">{order.code}</h2>
                  <span className="badge">{ORDER_STATUS_LABEL[order.status]}</span>
                </div>
                <div className="meta" style={{ margin: "0.6rem 0" }}>
                  <span>
                    {show?.title || "场次资料缺失"}
                    {show ? ` · ${formatShowTime(show.starts_at)} · ${show.venue}` : ""}
                  </span>
                  <span>{order.buyer_name} · {order.phone} · {order.contact_extra}</span>
                  <span>
                    {order.quantity} 张 · 应付{" "}
                    <strong>
                      {centsToCny(order.ticket_total_cents + order.deposit_total_cents)}
                    </strong>
                  </span>
                  <span>下单 {formatShowTime(order.created_at)}</span>
                  {order.admin_note && <span>备注：{order.admin_note}</span>}
                </div>
                {proofUrls.has(order.id) && (
                  <p>
                    <a href={proofUrls.get(order.id)} target="_blank" rel="noreferrer">
                      查看付款截图
                    </a>
                  </p>
                )}
                {order.status === "pending_confirm" && (
                  <form action={confirmSupabaseOrderAction}>
                    <input type="hidden" name="code" value={order.code} />
                    <button className="btn" type="submit">确认收款并出票</button>
                  </form>
                )}
                {["issued", "checked_in", "deposit_refunded"].includes(order.status) && (
                  <div className="row" style={{ marginTop: "0.8rem" }}>
                    <span className="muted">
                      {order.email_sent_at
                        ? `邮件已发送：${formatShowTime(order.email_sent_at)}`
                        : "尚未发送出票邮件"}
                    </span>
                    <form action={sendTicketEmailAction}>
                      <input type="hidden" name="code" value={order.code} />
                      <button className="btn secondary" type="submit">
                        {order.email_sent_at ? "重发出票邮件" : "发送出票邮件"}
                      </button>
                    </form>
                  </div>
                )}
                {(order.status === "pending_payment" ||
                  order.status === "pending_confirm") && (
                  <div className="row" style={{ marginTop: "0.8rem" }}>
                    <form action={closeSupabaseOrderAction}>
                      <input type="hidden" name="code" value={order.code} />
                      <input type="hidden" name="status" value="cancelled" />
                      <input type="hidden" name="reason" value="管理员驳回" />
                      <button className="btn danger" type="submit">驳回订单</button>
                    </form>
                    <form action={closeSupabaseOrderAction}>
                      <input type="hidden" name="code" value={order.code} />
                      <input type="hidden" name="status" value="expired" />
                      <input type="hidden" name="reason" value="管理员释放库存" />
                      <button className="btn secondary" type="submit">释放库存</button>
                    </form>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
