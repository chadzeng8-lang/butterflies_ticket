import { redirect } from "next/navigation";
import Link from "next/link";
import {
  closeSupabaseOrderAction,
  confirmSupabaseOrderAction,
  sendTicketEmailAction,
  updateSupabaseOrderAction,
} from "@/app/actions/supabase-admin";
import {
  AdminInventorySummary,
  type AdminInventoryShow,
} from "@/components/AdminInventorySummary";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
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
  user_id: string;
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
  confirmed_at: string | null;
};

type OnlineShow = {
  id: number;
  title: string;
  starts_at: string;
  venue: string;
  capacity: number;
};

const ACTIVE_HOLD_STATUSES: OrderStatus[] = [
  "pending_payment",
  "pending_confirm",
  "issued",
  "checked_in",
  "deposit_refunded",
];

type OnlineTicket = {
  id: number;
  order_id: number;
  code: string;
  checked_in_at: string | null;
  deposit_refunded_at: string | null;
};

const STATUS_OPTIONS: OrderStatus[] = [
  "pending_payment",
  "pending_confirm",
  "issued",
  "checked_in",
  "deposit_refunded",
  "cancelled",
  "expired",
];

function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case "pending_payment":
    case "pending_confirm":
      return "badge warn";
    case "issued":
    case "checked_in":
    case "deposit_refunded":
      return "badge success";
    case "cancelled":
    case "expired":
      return "badge danger";
    default:
      return "badge";
  }
}

function matchesQuery(
  order: OnlineOrder,
  show: OnlineShow | undefined,
  accountEmail: string,
  tickets: OnlineTicket[],
  query: string,
): boolean {
  if (!query) return true;
  const haystack = [
    order.code,
    order.buyer_name,
    order.phone,
    order.contact_extra,
    accountEmail,
    order.status,
    ORDER_STATUS_LABEL[order.status],
    order.admin_note,
    show?.title,
    show?.venue,
    show ? formatShowTime(show.starts_at) : "",
    ...tickets.map((ticket) => ticket.code),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export default async function OnlineOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; done?: string; q?: string }>;
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
  const query = String(params.q || "").trim().toLowerCase();

  const { data: orderData, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (ordersError) throw new Error("SUPABASE_ORDER_LOOKUP_FAILED");

  const orders = orderData as OnlineOrder[];
  const showsById = new Map<number, OnlineShow>();
  const { data: showData, error: showsError } = await supabase
    .from("shows")
    .select("id, title, starts_at, venue, capacity")
    .order("starts_at");
  if (showsError) throw new Error("SUPABASE_SHOW_LOOKUP_FAILED");
  const shows = (showData || []) as OnlineShow[];
  for (const show of shows) showsById.set(show.id, show);

  const accountEmailByOrderId = new Map<number, string>();
  const { data: accountRows, error: accountError } = await supabase.rpc(
    "admin_list_order_account_emails",
  );
  if (!accountError && Array.isArray(accountRows)) {
    for (const row of accountRows as {
      order_id: number;
      account_email: string;
    }[]) {
      accountEmailByOrderId.set(row.order_id, row.account_email || "");
    }
  }

  const heldByShow = new Map<number, number>();
  for (const order of orders) {
    if (!ACTIVE_HOLD_STATUSES.includes(order.status)) continue;
    heldByShow.set(
      order.show_id,
      (heldByShow.get(order.show_id) || 0) + order.quantity,
    );
  }

  const inventoryShows: AdminInventoryShow[] = shows.map((show) => ({
    id: show.id,
    title: show.title,
    starts_at: show.starts_at,
    venue: show.venue,
    capacity: show.capacity,
    held: heldByShow.get(show.id) || 0,
  }));

  const ticketsByOrder = new Map<number, OnlineTicket[]>();
  if (orders.length > 0) {
    const { data: ticketData, error: ticketsError } = await supabase
      .from("tickets")
      .select("id, order_id, code, checked_in_at, deposit_refunded_at")
      .in(
        "order_id",
        orders.map((order) => order.id),
      )
      .order("id");
    if (ticketsError) throw new Error("SUPABASE_TICKET_LOOKUP_FAILED");
    for (const ticket of (ticketData || []) as OnlineTicket[]) {
      const list = ticketsByOrder.get(ticket.order_id) || [];
      list.push(ticket);
      ticketsByOrder.set(ticket.order_id, list);
    }
  }

  const proofUrls = new Map<number, string>();
  await Promise.all(
    orders.map(async (order) => {
      if (!order.payment_proof_path) return;
      const { data, error } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(order.payment_proof_path, 60);
      if (error) throw new Error("PAYMENT_PROOF_URL_FAILED");
      proofUrls.set(order.id, data.signedUrl);
    }),
  );

  const visibleOrders = orders.filter((order) =>
    matchesQuery(
      order,
      showsById.get(order.show_id),
      accountEmailByOrderId.get(order.id) || order.contact_extra || "",
      ticketsByOrder.get(order.id) || [],
      query,
    ),
  );

  const errorMessage =
    params.error === "EMAIL_CONFIG_MISSING"
      ? "缺少 Resend 配置。请在运行网站的环境中设置 RESEND_API_KEY、EMAIL_FROM 和 NEXT_PUBLIC_SITE_URL，并重启网站。"
      : params.error === "EMAIL_API_KEY_INVALID"
        ? "Resend API Key 无效或已撤销，请检查运行环境中的 RESEND_API_KEY。"
        : params.error === "EMAIL_SENDER_UNVERIFIED"
          ? "Resend 拒绝了发件地址。请验证发件域名，并使用该域名下的 EMAIL_FROM 地址。"
          : params.error === "EMAIL_RECIPIENT_RESTRICTED"
            ? "Resend 测试模式限制了收件地址。请确认收件地址已获授权，或验证自己的发件域名。"
            : params.error === "EMAIL_RATE_LIMITED"
              ? "Resend 发送频率受限，请稍后重试。"
              : params.error === "EMAIL_PROVIDER_UNAVAILABLE" ||
                  params.error === "EMAIL_NETWORK_ERROR"
                ? "暂时无法连接 Resend，请检查网络后重试。"
                : params.error === "EMAIL_PROVIDER_REJECTED"
                  ? "Resend 拒绝了邮件请求，请检查 Resend 的发件人与收件人设置。"
                  : params.error === "email_recipient_missing"
                    ? "订单没有可用的账号电邮地址，无法发送出票通知。"
                    : params.error === "email_tracking"
                      ? "邮件可能已发送，但写入发送记录失败。请先检查收件箱与垃圾邮件，再决定是否重发。"
                      : params.error === "sold_out"
                        ? "保存失败：该场次对外余票不足，请先调整库存或减少张数。"
                        : params.error === "quantity"
                          ? "张数无效。"
                          : params.error === "buyer"
                            ? "姓名与手机号不能为空。"
                            : params.error === "account"
                              ? "注册账号不存在：请填写已在本站注册的电邮。"
                              : params.error === "rpc_missing" ||
                                  params.error === "migration"
                                ? "库存/编辑功能未就绪。请在 Supabase 依次执行 20261105170000、20261105173000 与 20261106093000 迁移。"
                                : params.error === "capacity"
                                  ? "总票数须为至少 1 的整数。"
                                  : params.error === "public_negative" ||
                                      params.error === "internal_gt_capacity"
                                    ? "票数调整无效：对外剩余不能小于已占用，内部预留也不能超过总票数。"
                                    : params.error === "edit"
                                      ? "订单保存失败，请刷新后重试。"
                                      : params.error === "save"
                                        ? "票数保存失败，请刷新后重试。"
                                        : params.error?.startsWith("email_")
                                          ? "查询订单或发送记录失败，请刷新页面后重试。"
                                          : params.error
                                            ? "操作失败，订单状态可能已变更；请刷新后重新核对。"
                                            : null;

  return (
    <main className="shell shell-wide">
      <SiteHeader />
      <section className="hero">
        <h1>在线订单管理</h1>
        <p>表格中直接编辑并保存；可按订单号、姓名、手机、注册账号等查询。</p>
        <div className="row" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
          <Link className="btn secondary" href="/admin/online-inventory">
            场次库存
          </Link>
          <Link className="btn secondary" href="/admin/online-checkin">
            前往现场核销
          </Link>
        </div>
      </section>

      <AdminInventorySummary
        shows={inventoryShows}
        returnTo="/admin/online-orders"
      />

      {errorMessage && (
        <div className="error" role="alert">
          {errorMessage}
        </div>
      )}
      {params.done && (
        <div className="success" role="status">
          {params.done === "email"
            ? "出票邮件已发送。若未收到，请检查垃圾邮件。"
            : params.done === "confirm"
              ? "订单已确认并出票，邮件已发送。若未收到，请检查垃圾邮件。"
              : params.done === "edit"
                ? "订单已保存。"
                : params.done === "save"
                  ? "票数已更新。"
                  : "订单状态已更新。"}
        </div>
      )}

      <form className="admin-sheet-search" method="get" action="/admin/online-orders">
        <label>
          查询订单
          <input
            type="search"
            name="q"
            defaultValue={params.q || ""}
            placeholder="订单号 / 姓名 / 手机 / 注册账号 / 状态…"
          />
        </label>
        <button className="btn secondary" type="submit">
          查询
        </button>
        {query ? (
          <Link className="btn secondary" href="/admin/online-orders">
            清除
          </Link>
        ) : null}
        <span className="muted admin-sheet-count">
          显示 {visibleOrders.length} / {orders.length} 笔
        </span>
      </form>

      {accountError && (
        <div className="notice" role="status">
          注册账号列需先执行迁移 `20261106093000_admin_order_account.sql`，否则暂以联系电邮回退显示。
        </div>
      )}

      {orders.length === 0 ? (
        <div className="panel muted">目前没有在线订单。</div>
      ) : visibleOrders.length === 0 ? (
        <div className="panel muted">没有符合查询条件的订单。</div>
      ) : (
        <div className="admin-sheet-wrap">
          <table className="admin-sheet">
            <thead>
              <tr>
                <th>订单号</th>
                <th>状态</th>
                <th>场次</th>
                <th>姓名</th>
                <th>手机</th>
                <th>注册账号</th>
                <th>联系电邮</th>
                <th>张数</th>
                <th>应付</th>
                <th>下单</th>
                <th>备注</th>
                <th>凭证 / 票</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => {
                const formId = `order-edit-${order.id}`;
                const tickets = ticketsByOrder.get(order.id) || [];
                const accountEmail =
                  accountEmailByOrderId.get(order.id) ||
                  order.contact_extra ||
                  "";
                return (
                  <tr key={order.id}>
                    <td className="admin-sheet-code">
                      <form id={formId} action={updateSupabaseOrderAction}>
                        <input type="hidden" name="code" value={order.code} />
                      </form>
                      <Link href={`/orders/${order.code}`}>{order.code}</Link>
                      <span className={statusBadgeClass(order.status)}>
                        {ORDER_STATUS_LABEL[order.status]}
                      </span>
                    </td>
                    <td>
                      <select
                        form={formId}
                        name="status"
                        defaultValue={order.status}
                        aria-label={`${order.code} 状态`}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {ORDER_STATUS_LABEL[status]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        form={formId}
                        name="showId"
                        defaultValue={order.show_id}
                        aria-label={`${order.code} 场次`}
                      >
                        {shows.map((item) => (
                          <option key={item.id} value={item.id}>
                            {formatShowTime(item.starts_at)} · {item.venue}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        form={formId}
                        name="buyerName"
                        defaultValue={order.buyer_name}
                        required
                        aria-label={`${order.code} 姓名`}
                      />
                    </td>
                    <td>
                      <input
                        form={formId}
                        name="phone"
                        defaultValue={order.phone}
                        required
                        aria-label={`${order.code} 手机`}
                      />
                    </td>
                    <td>
                      <input
                        form={formId}
                        name="accountEmail"
                        type="email"
                        defaultValue={accountEmail}
                        placeholder="已注册电邮"
                        aria-label={`${order.code} 注册账号`}
                      />
                    </td>
                    <td>
                      <input
                        form={formId}
                        name="contactExtra"
                        type="email"
                        defaultValue={order.contact_extra}
                        placeholder="出票联系电邮"
                        aria-label={`${order.code} 联系电邮`}
                      />
                    </td>
                    <td>
                      <input
                        form={formId}
                        name="quantity"
                        type="number"
                        min={1}
                        max={20}
                        defaultValue={order.quantity}
                        required
                        aria-label={`${order.code} 张数`}
                      />
                    </td>
                    <td className="admin-sheet-readonly">
                      {centsToCny(
                        order.ticket_total_cents + order.deposit_total_cents,
                      )}
                    </td>
                    <td className="admin-sheet-readonly">
                      {formatShowTime(order.created_at)}
                    </td>
                    <td>
                      <input
                        form={formId}
                        name="adminNote"
                        defaultValue={order.admin_note}
                        aria-label={`${order.code} 备注`}
                      />
                    </td>
                    <td className="admin-sheet-meta">
                      {proofUrls.has(order.id) ? (
                        <a
                          href={proofUrls.get(order.id)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          付款截图
                        </a>
                      ) : (
                        <span className="muted">无凭证</span>
                      )}
                      {tickets.length > 0 ? (
                        <span className="muted">
                          {tickets
                            .map((ticket) => {
                              const flags = [
                                ticket.checked_in_at ? "核" : null,
                                ticket.deposit_refunded_at ? "退" : null,
                              ].filter(Boolean);
                              return flags.length
                                ? `${ticket.code}(${flags.join("")})`
                                : ticket.code;
                            })
                            .join(" ")}
                        </span>
                      ) : null}
                      {order.email_sent_at ? (
                        <span className="muted">
                          邮件 {formatShowTime(order.email_sent_at)}
                        </span>
                      ) : null}
                    </td>
                    <td className="admin-sheet-actions">
                      <button type="submit" form={formId} className="btn">
                        保存
                      </button>
                      {order.status === "pending_confirm" && (
                        <form action={confirmSupabaseOrderAction}>
                          <input type="hidden" name="code" value={order.code} />
                          <PendingSubmitButton
                            className="btn secondary"
                            pendingLabel="出票中…"
                          >
                            出票
                          </PendingSubmitButton>
                        </form>
                      )}
                      {["issued", "checked_in", "deposit_refunded"].includes(
                        order.status,
                      ) && (
                        <form action={sendTicketEmailAction}>
                          <input type="hidden" name="code" value={order.code} />
                          <PendingSubmitButton
                            className="btn secondary"
                            pendingLabel="发送中…"
                          >
                            {order.email_sent_at ? "重发邮件" : "发邮件"}
                          </PendingSubmitButton>
                        </form>
                      )}
                      {(order.status === "pending_payment" ||
                        order.status === "pending_confirm") && (
                        <>
                          <form action={closeSupabaseOrderAction}>
                            <input type="hidden" name="code" value={order.code} />
                            <input type="hidden" name="status" value="cancelled" />
                            <input type="hidden" name="reason" value="管理员驳回" />
                            <PendingSubmitButton
                              className="btn danger"
                              pendingLabel="处理中…"
                            >
                              驳回
                            </PendingSubmitButton>
                          </form>
                          <form action={closeSupabaseOrderAction}>
                            <input type="hidden" name="code" value={order.code} />
                            <input type="hidden" name="status" value="expired" />
                            <input
                              type="hidden"
                              name="reason"
                              value="管理员释放库存"
                            />
                            <PendingSubmitButton
                              className="btn secondary"
                              pendingLabel="处理中…"
                            >
                              释放
                            </PendingSubmitButton>
                          </form>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
