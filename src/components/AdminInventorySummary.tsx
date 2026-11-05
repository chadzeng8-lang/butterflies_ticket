import { updateShowInventoryAction } from "@/app/actions/supabase-admin";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { formatShowTime } from "@/lib/format";
import { publicRemainingSeats } from "@/lib/inventory";

export type AdminInventoryShow = {
  id: number;
  title: string;
  starts_at: string;
  venue: string;
  capacity: number;
  held: number;
};

export function AdminInventorySummary({
  shows,
  returnTo = "/admin/online-orders",
}: {
  shows: AdminInventoryShow[];
  returnTo?: "/admin/online-orders" | "/admin/online-inventory";
}) {
  const totalCapacity = shows.reduce((sum, show) => sum + show.capacity, 0);
  const totalHeld = shows.reduce((sum, show) => sum + show.held, 0);
  const totalRemaining = shows.reduce(
    (sum, show) => sum + publicRemainingSeats(show.capacity, show.held),
    0,
  );

  if (shows.length === 0) {
    return <div className="panel muted">暂无场次，无法显示票数。</div>;
  }

  return (
    <section className="admin-inventory-summary" aria-label="票数总览">
      <div className="admin-inventory-totals">
        <div>
          <span className="eyebrow">全部场次</span>
          <strong>总票数 {totalCapacity}</strong>
          <span className="muted">
            已占用 {totalHeld} · 剩余 {totalRemaining}
          </span>
        </div>
      </div>

      <div className="admin-inventory-show-grid">
        {shows.map((show) => {
          const remaining = publicRemainingSeats(show.capacity, show.held);
          return (
            <article className="admin-inventory-show-card" key={show.id}>
              <div className="meta">
                <strong>{formatShowTime(show.starts_at)}</strong>
                <span>{show.venue}</span>
                <span>
                  已占用 {show.held} · 剩余{" "}
                  <strong className="price">{remaining}</strong>
                </span>
              </div>
              <form action={updateShowInventoryAction} className="admin-inventory-inline">
                <input type="hidden" name="showId" value={show.id} />
                <input type="hidden" name="next" value={returnTo} />
                <label>
                  总票数
                  <input
                    name="capacity"
                    type="number"
                    min={1}
                    step={1}
                    defaultValue={show.capacity}
                    required
                  />
                </label>
                <PendingSubmitButton className="btn secondary" pendingLabel="保存中…">
                  更新
                </PendingSubmitButton>
              </form>
            </article>
          );
        })}
      </div>
    </section>
  );
}
