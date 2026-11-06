import type { Show } from "@/lib/types";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SupabaseShowRow = {
  id: number;
  title: string;
  description: string;
  venue: string;
  starts_at: string;
  capacity: number;
  internal_reserved?: number | null;
  ticket_price_cents: number;
  deposit_cents: number;
  on_sale: boolean;
  wechat_qr_path: string | null;
  alipay_qr_path: string | null;
  fps_qr_path: string | null;
  payment_note: string;
  created_at: string;
  updated_at: string;
};

export function mapSupabaseShow(row: SupabaseShowRow): Show {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    venue: row.venue,
    startsAt: row.starts_at,
    capacity: row.capacity,
    internalReserved: row.internal_reserved ?? 0,
    ticketPriceCents: row.ticket_price_cents,
    depositCents: row.deposit_cents,
    onSale: row.on_sale ? 1 : 0,
    wechatQrPath: row.wechat_qr_path,
    alipayQrPath: row.alipay_qr_path,
    fpsQrPath: row.fps_qr_path,
    paymentNote: row.payment_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSupabaseShows(includeOffSale = false): Promise<Show[]> {
  // Public/anonymous client so marketing pages can use ISR without reading cookies.
  const supabase = createSupabasePublicClient();
  let query = supabase.from("shows").select("*").order("starts_at");
  if (!includeOffSale) query = query.eq("on_sale", true);

  const { data, error } = await query;
  if (error) throw new Error("SUPABASE_SHOW_LOOKUP_FAILED");
  return (data as SupabaseShowRow[]).map(mapSupabaseShow);
}

export async function getSupabaseShow(id: number): Promise<Show | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("shows")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("SUPABASE_SHOW_LOOKUP_FAILED");
  return data ? mapSupabaseShow(data as SupabaseShowRow) : null;
}
