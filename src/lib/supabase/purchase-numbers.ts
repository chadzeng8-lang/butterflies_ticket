import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Load per-show purchase numbers via security-definer RPC (works for audience too). */
export async function loadPurchaseNumbersForShows(
  showIds: number[],
): Promise<Map<number, number>> {
  const uniqueShowIds = [
    ...new Set(showIds.filter((id) => Number.isFinite(id) && id > 0)),
  ];
  if (uniqueShowIds.length === 0) return new Map();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_order_purchase_numbers", {
    p_show_ids: uniqueShowIds,
  });

  if (error) {
    // Fallback for environments that have not run the migration yet:
    // only accurate for callers who can already see all show orders (admins).
    const { data: rows, error: fallbackError } = await supabase
      .from("orders")
      .select("id, show_id, created_at")
      .in("show_id", uniqueShowIds)
      .order("created_at", { ascending: true });
    if (fallbackError) throw new Error("SUPABASE_PURCHASE_NUMBER_LOOKUP_FAILED");

    const { purchaseNumbersByShow } = await import("@/lib/purchase-number");
    return purchaseNumbersByShow(
      (rows || []) as Array<{ id: number; show_id: number; created_at: string }>,
    );
  }

  const numbers = new Map<number, number>();
  for (const row of (data || []) as Array<{
    order_id: number;
    purchase_no: number;
  }>) {
    numbers.set(Number(row.order_id), Number(row.purchase_no));
  }
  return numbers;
}
