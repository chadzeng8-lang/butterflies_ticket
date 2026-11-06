import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AdminInventorySummary,
  type AdminInventoryShow,
} from "@/components/AdminInventorySummary";
import { AdminSectionNav } from "@/components/AdminSectionNav";
import {
  OnlineOrdersBulkPanel,
  type BulkOrderGroup,
} from "@/components/OnlineOrdersBulkPanel";
import { SiteHeader } from "@/components/SiteHeader";
import { formatShowTime } from "@/lib/format";
import { phoneTail } from "@/lib/phone";
import {
  createSupabaseServerClient,
  getSupabaseUser,
} from "@/lib/supabase/server";
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

function purchaseNumbersByShow(orders: OnlineOrder[]): Map<number, number> {
  const byShow = new Map<number, OnlineOrder[]>();
  for (const order of orders) {
    const list = byShow.get(order.show_id) || [];
    list.push(order);
    byShow.set(order.show_id, list);
  }
  const numbers = new Map<number, number>();
  for (const list of byShow.values()) {
    list
      .slice()
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime() ||
          a.id - b.id,
      )
      .forEach((order, index) => {
        numbers.set(order.id, index + 1);
      });
  }
  return numbers;
}

function matchesQuery(
  order: OnlineOrder,
  show: OnlineShow | undefined,
  accountEmail: string,
  purchaseNo: number,
  query: string,
): boolean {
  if (!query) return true;
  const haystack = [
    String(purchaseNo),
    order.phone,
    phoneTail(order.phone),
    order.contact_extra,
    accountEmail,
    order.status,
    ORDER_STATUS_LABEL[order.status],
    order.admin_note,
    show?.title,
    show?.venue,
    show ? formatShowTime(show.starts_at) : "",
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
  const purchaseNumbers = purchaseNumbersByShow(orders);
  const showsById = new Map<number, OnlineShow>();
  const { data: showData, error: showsError } = await supabase
    .from("shows")
    .select("id, title, starts_at, venue, capacity")
    .order("starts_at");
  if (showsError) throw new Error("SUPABASE_SHOW_LOOKUP_FAILED");
  const shows = (showData || []) as OnlineShow[];
  for (const show of shows) showsById.set(show.id, show);

  const accountEmailByOrderId = new Map<number, string>();
  const { data: accountRows } = await supabase.rpc("admin_list_order_account_emails");
  if (Array.isArray(accountRows)) {
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

  const visibleOrders = orders.filter((order) =>
    matchesQuery(
      order,
      showsById.get(order.show_id),
      accountEmailByOrderId.get(order.id) || order.contact_extra || "",
      purchaseNumbers.get(order.id) || 0,
      query,
    ),
  );

  const proofPaths = [
    ...new Set(
      visibleOrders
        .map((order) => order.payment_proof_path)
        .filter((path): path is string => Boolean(path)),
    ),
  ];
  const paymentProofUrlByPath = new Map<string, string>();
  await Promise.all(
    proofPaths.map(async (path) => {
      const { data } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(path, 60 * 60);
      if (data?.signedUrl) paymentProofUrlByPath.set(path, data.signedUrl);
    }),
  );

  const bulkGroups: BulkOrderGroup[] = shows.map((show) => {
    const showOrders = visibleOrders
      .filter((order) => order.show_id === show.id)
      .sort(
        (a, b) =>
          (purchaseNumbers.get(a.id) || 0) - (purchaseNumbers.get(b.id) || 0),
      );
    return {
      showId: show.id,
      showTime: formatShowTime(show.starts_at),
      showTitle: show.title,
      venue: show.venue,
      capacity: show.capacity,
      remaining: Math.max(0, show.capacity - (heldByShow.get(show.id) || 0)),
      orders: showOrders.map((order) => ({
        id: order.id,
        code: order.code,
        showId: order.show_id,
        buyerName: order.buyer_name,
        phone: order.phone,
        contactExtra: order.contact_extra,
        quantity: order.quantity,
        status: order.status,
        adminNote: order.admin_note,
        emailSentAt: order.email_sent_at,
        accountEmail:
          accountEmailByOrderId.get(order.id) || order.contact_extra || "",
        purchaseNo: purchaseNumbers.get(order.id) || 0,
        paymentProofUrl: order.payment_proof_path
          ? paymentProofUrlByPath.get(order.payment_proof_path) || null
          : null,
      })),
    };
  });

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
                                : params.error === "bulk_migration"
                                  ? "批量操作未就绪。请在 Supabase 执行迁移 20261106103000_admin_bulk_orders.sql。"
                                  : params.error === "bulk_none"
                                    ? "请先勾选至少一笔订单。"
                                    : params.error === "bulk_status"
                                      ? "批量状态无效。"
                                      : params.error === "bulk_status_failed"
                                        ? "批量改状态失败，请刷新后重试。"
                                        : params.error === "bulk_delete_failed"
                                          ? "批量删除失败，请刷新后重试。"
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
        <p>
          各场次购票编号从 1 起按下单顺序固定。可勾选后批量改状态或删除；也可导出表格到现场核对。
        </p>
        <AdminSectionNav current="orders" />
        <div className="admin-hero-actions">
          <Link className="btn secondary" href="/admin/online-orders/export">
            导出全部 Excel
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
                  : params.done === "bulk_status"
                    ? "已批量更新所选订单状态。"
                    : params.done === "bulk_delete"
                      ? "已删除所选订单。"
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
            placeholder="购票编号 / 手机 / 联系电邮 / 状态…"
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

      {orders.length === 0 ? (
        <div className="panel muted">目前没有在线订单。</div>
      ) : visibleOrders.length === 0 ? (
        <div className="panel muted">没有符合查询条件的订单。</div>
      ) : (
        <OnlineOrdersBulkPanel groups={bulkGroups} />
      )}
    </main>
  );
}
