import Link from "next/link";
import { redirect } from "next/navigation";
import { rebindOrderAccountAction } from "@/app/actions/supabase-admin";
import { AdminSectionNav } from "@/components/AdminSectionNav";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { SiteHeader } from "@/components/SiteHeader";
import { formatShowTime } from "@/lib/format";
import {
  createSupabaseServerClient,
  getSupabaseUser,
} from "@/lib/supabase/server";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type AccountRow = {
  user_id: string;
  email: string;
  role: string;
  full_name: string | null;
  created_at: string;
  order_count: number;
};

type OnlineOrder = {
  id: number;
  code: string;
  show_id: number;
  user_id: string;
  phone: string;
  quantity: number;
  status: OrderStatus;
  created_at: string;
};

type OnlineShow = {
  id: number;
  title: string;
  starts_at: string;
  venue: string;
};

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

function roleLabel(role: string): string {
  return role === "admin" ? "管理员" : "观众";
}

export default async function OnlineAccountsPage({
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

  const { data: accountData, error: accountsError } = await supabase.rpc(
    "admin_list_accounts",
  );
  if (accountsError) {
    const missing =
      /could not find the function|schema cache|does not exist/i.test(
        accountsError.message || "",
      );
    return (
      <main className="shell shell-wide">
        <SiteHeader />
        <section className="hero">
          <h1>管理账号</h1>
          <p>查看注册账号，并将订单改绑到其他已注册电邮。</p>
          <AdminSectionNav current="accounts" />
        </section>
        <div className="error" role="alert">
          {missing
            ? "账号管理功能未就绪。请在 Supabase 执行迁移 20261106101500_admin_list_accounts.sql。"
            : "无法读取注册账号，请刷新后重试。"}
        </div>
      </main>
    );
  }

  const accounts = (accountData || []) as AccountRow[];

  const { data: orderData, error: ordersError } = await supabase
    .from("orders")
    .select("id, code, show_id, user_id, phone, quantity, status, created_at")
    .order("created_at", { ascending: true });
  if (ordersError) throw new Error("SUPABASE_ORDER_LOOKUP_FAILED");
  const orders = (orderData || []) as OnlineOrder[];
  const purchaseNumbers = purchaseNumbersByShow(orders);

  const { data: showData, error: showsError } = await supabase
    .from("shows")
    .select("id, title, starts_at, venue")
    .order("starts_at");
  if (showsError) throw new Error("SUPABASE_SHOW_LOOKUP_FAILED");
  const showsById = new Map(
    ((showData || []) as OnlineShow[]).map((show) => [show.id, show]),
  );

  const ordersByUser = new Map<string, OnlineOrder[]>();
  for (const order of orders) {
    const list = ordersByUser.get(order.user_id) || [];
    list.push(order);
    ordersByUser.set(order.user_id, list);
  }

  const visibleAccounts = accounts.filter((account) => {
    if (!query) return true;
    const accountOrders = ordersByUser.get(account.user_id) || [];
    const haystack = [
      account.email,
      account.full_name || "",
      roleLabel(account.role),
      account.role,
      ...accountOrders.flatMap((order) => {
        const show = showsById.get(order.show_id);
        return [
          String(purchaseNumbers.get(order.id) || ""),
          order.phone,
          order.status,
          ORDER_STATUS_LABEL[order.status],
          show?.title || "",
          show ? formatShowTime(show.starts_at) : "",
        ];
      }),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  const returnTo = query
    ? `/admin/online-accounts?q=${encodeURIComponent(params.q || "")}`
    : "/admin/online-accounts";

  const errorMessage =
    params.error === "account"
      ? "改绑失败：请填写已在本站注册的电邮。"
      : params.error === "migration"
        ? "账号管理功能未就绪。请在 Supabase 执行迁移 20261106101500_admin_list_accounts.sql。"
        : params.error === "delete_migration"
          ? "删除账号未就绪。请在 Supabase 执行迁移 20261106110000_admin_delete_account.sql。"
          : params.error === "delete_self"
            ? "不能删除当前登录的管理员账号。"
            : params.error === "account_missing"
              ? "账号不存在或已被删除。"
              : params.error === "delete_failed"
                ? "删除账号失败，请刷新后重试。"
                : params.error === "rebind"
                  ? "改绑失败，请刷新后重试。"
                  : params.error
                    ? "操作失败，请刷新后重试。"
                    : null;

  return (
    <main className="shell shell-wide">
      <SiteHeader />
      <section className="hero">
        <h1>管理账号</h1>
        <p>
          按注册电邮查看账号与名下订单；可改绑订单，或删除账号（会一并删除其订单，不能删当前登录账号）。
        </p>
        <AdminSectionNav current="accounts" />
      </section>

      {errorMessage && (
        <div className="error" role="alert">
          {errorMessage}
        </div>
      )}
      {params.done === "rebind" && (
        <div className="success" role="status">
          订单已改绑到新账号。
        </div>
      )}
      {params.done === "delete" && (
        <div className="success" role="status">
          账号及其订单已删除。
        </div>
      )}

      <form className="admin-sheet-search" method="get" action="/admin/online-accounts">
        <label>
          查询账号
          <input
            type="search"
            name="q"
            defaultValue={params.q || ""}
            placeholder="电邮 / 购票编号 / 手机 / 场次…"
          />
        </label>
        <button className="btn secondary" type="submit">
          查询
        </button>
        {query ? (
          <Link className="btn secondary" href="/admin/online-accounts">
            清除
          </Link>
        ) : null}
        <span className="muted admin-sheet-count">
          显示 {visibleAccounts.length} / {accounts.length} 个账号
        </span>
      </form>

      {accounts.length === 0 ? (
        <div className="panel muted">目前还没有注册账号。</div>
      ) : visibleAccounts.length === 0 ? (
        <div className="panel muted">没有符合查询条件的账号。</div>
      ) : (
        <div className="admin-sheet-groups">
          {visibleAccounts.map((account) => {
            const accountOrders = (ordersByUser.get(account.user_id) || [])
              .slice()
              .sort(
                (a, b) =>
                  new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime() || a.id - b.id,
              );
            return (
              <section className="admin-sheet-group" key={account.user_id}>
                <div className="admin-sheet-group-head">
                  <div>
                    <h2>{account.email}</h2>
                    <p className="muted">
                      {roleLabel(account.role)}
                      {account.full_name ? ` · ${account.full_name}` : ""}
                      {" · "}
                      订单 {account.order_count} 笔
                    </p>
                  </div>
                  {account.user_id !== user.id ? (
                    <div className="admin-sheet-group-actions">
                      <DeleteAccountButton
                        userId={account.user_id}
                        email={account.email}
                        orderCount={Number(account.order_count) || 0}
                        returnTo={returnTo}
                      />
                    </div>
                  ) : (
                    <p className="muted admin-sheet-stock">当前登录账号</p>
                  )}
                </div>
                {accountOrders.length === 0 ? (
                  <div className="panel muted">此账号暂无订单。</div>
                ) : (
                  <div className="admin-sheet-wrap">
                    <table className="admin-sheet admin-accounts-sheet">
                      <thead>
                        <tr>
                          <th>购票编号</th>
                          <th>场次</th>
                          <th>手机</th>
                          <th>张数</th>
                          <th>状态</th>
                          <th>改绑到电邮</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accountOrders.map((order) => {
                          const show = showsById.get(order.show_id);
                          const formId = `rebind-${order.id}`;
                          return (
                            <tr key={order.id}>
                              <td className="admin-sheet-code">
                                <strong>
                                  {purchaseNumbers.get(order.id) || "—"}
                                </strong>
                              </td>
                              <td className="admin-accounts-show">
                                {show
                                  ? formatShowTime(show.starts_at)
                                  : `场次 #${order.show_id}`}
                              </td>
                              <td>{order.phone}</td>
                              <td>{order.quantity}</td>
                              <td>{ORDER_STATUS_LABEL[order.status]}</td>
                              <td>
                                <form id={formId} action={rebindOrderAccountAction}>
                                  <input type="hidden" name="code" value={order.code} />
                                  <input type="hidden" name="returnTo" value={returnTo} />
                                  <input
                                    name="accountEmail"
                                    type="email"
                                    required
                                    defaultValue={account.email}
                                    placeholder="已注册电邮"
                                    aria-label={`订单编号 ${purchaseNumbers.get(order.id)} 改绑电邮`}
                                  />
                                </form>
                              </td>
                              <td className="admin-sheet-actions">
                                <button type="submit" form={formId} className="btn">
                                  改绑
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
