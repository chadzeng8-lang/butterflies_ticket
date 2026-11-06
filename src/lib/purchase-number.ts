/** Per-show purchase numbers starting at 1, by earliest created_at then id. */
export function purchaseNumbersByShow<
  T extends { id: number; show_id?: number; showId?: number; created_at?: string; createdAt?: string },
>(orders: T[]): Map<number, number> {
  const byShow = new Map<number, T[]>();
  for (const order of orders) {
    const showId = Number(order.show_id ?? order.showId);
    if (!Number.isFinite(showId)) continue;
    const list = byShow.get(showId) || [];
    list.push(order);
    byShow.set(showId, list);
  }

  const numbers = new Map<number, number>();
  for (const list of byShow.values()) {
    list
      .slice()
      .sort((a, b) => {
        const aTime = new Date(a.created_at || a.createdAt || 0).getTime();
        const bTime = new Date(b.created_at || b.createdAt || 0).getTime();
        return aTime - bTime || a.id - b.id;
      })
      .forEach((order, index) => {
        numbers.set(order.id, index + 1);
      });
  }
  return numbers;
}
