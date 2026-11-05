import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AdminInventorySummary,
  type AdminInventoryShow,
} from "@/components/AdminInventorySummary";
import { SiteHeader } from "@/components/SiteHeader";
import {
  createSupabaseServerClient,
  getSupabaseUser,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = [
  "pending_payment",
  "pending_confirm",
  "issued",
  "checked_in",
  "deposit_refunded",
] as const;

type InventoryShow = {
  id: number;
  title: string;
  starts_at: string;
  venue: string;
  capacity: number;
};

export default async function OnlineInventoryPage({
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
  const { data: showData, error: showsError } = await supabase
    .from("shows")
    .select("id, title, starts_at, venue, capacity")
    .order("starts_at");
  if (showsError) throw new Error("SUPABASE_SHOW_LOOKUP_FAILED");

  const shows = (showData || []) as InventoryShow[];
  const heldByShow = new Map<number, number>();

  if (shows.length > 0) {
    const { data: orderData, error: ordersError } = await supabase
      .from("orders")
      .select("show_id, quantity, status")
      .in(
        "show_id",
        shows.map((show) => show.id),
      )
      .in("status", [...ACTIVE_STATUSES]);
    if (ordersError) throw new Error("SUPABASE_ORDER_LOOKUP_FAILED");

    for (const order of orderData || []) {
      const showId = Number(order.show_id);
      heldByShow.set(
        showId,
        (heldByShow.get(showId) || 0) + Number(order.quantity || 0),
      );
    }
  }

  const inventoryShows: AdminInventoryShow[] = shows.map((show) => ({
    id: show.id,
    title: show.title,
    starts_at: show.starts_at,
    venue: show.venue,
    capacity: show.capacity,
    held: heldByShow.get(show.id) || 0,
  }));

  const errorMessage =
    params.error === "capacity"
      ? "总票数须为至少 1 的整数。"
      : params.error === "public_negative"
        ? "总票数不能小于已占用票数。"
        : params.error === "save"
          ? "保存失败，请刷新后重试。"
          : params.error === "lookup"
            ? "读取已占用票数失败，请刷新重试。"
            : params.error
              ? "参数无效，请检查后重试。"
              : null;

  return (
    <main className="shell">
      <SiteHeader />
      <section className="hero">
        <h1>场次库存</h1>
        <p>设置每场总票数。剩余 = 总票数 − 已占用订单。管理员可在开票前通过购票页直接报名。</p>
        <div className="row" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
          <Link className="btn secondary" href="/admin/online-orders">
            订单管理
          </Link>
          <Link className="btn secondary" href="/shows">
            去报名（管理员可提前）
          </Link>
          <Link className="btn secondary" href="/admin/online-checkin">
            现场核销
          </Link>
        </div>
      </section>

      {errorMessage && (
        <div className="error" role="alert">
          {errorMessage}
        </div>
      )}
      {params.done === "save" && (
        <div className="success" role="status">
          票数已更新。
        </div>
      )}

      <AdminInventorySummary
        shows={inventoryShows}
        returnTo="/admin/online-inventory"
      />
    </main>
  );
}
