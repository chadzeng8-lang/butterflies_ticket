import type { Order, OrderStatus, OrderWithShow, Show, Ticket } from "@/lib/types";
import {
  createSupabaseServerClient,
  getSupabaseUser,
} from "@/lib/supabase/server";
import {
  mapSupabaseShow,
  type SupabaseShowRow,
} from "@/lib/supabase/shows";

type OrderRow = {
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
  admin_note: string;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
};

type TicketRow = {
  id: number;
  order_id: number;
  code: string;
  checked_in_at: string | null;
  deposit_refunded_at: string | null;
  refunded_by: string | null;
  created_at: string;
};

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    code: row.code,
    showId: row.show_id,
    buyerName: row.buyer_name,
    phone: row.phone,
    contactExtra: row.contact_extra,
    quantity: row.quantity,
    ticketTotalCents: row.ticket_total_cents,
    depositTotalCents: row.deposit_total_cents,
    status: row.status,
    paymentProofPath: row.payment_proof_path,
    adminNote: row.admin_note,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
  };
}

function mapTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    orderId: row.order_id,
    code: row.code,
    checkedInAt: row.checked_in_at,
    depositRefundedAt: row.deposit_refunded_at,
    refundedBy: row.refunded_by,
    createdAt: row.created_at,
  };
}

export async function getSupabaseOrderWithShow(code: string): Promise<{
  order: OrderWithShow;
  show: Show;
  tickets: Ticket[];
} | null> {
  const supabase = await createSupabaseServerClient();
  const user = await getSupabaseUser(supabase);
  if (!user) return null;

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  if (orderError) throw new Error("SUPABASE_ORDER_LOOKUP_FAILED");
  if (!orderData) return null;

  const orderRow = orderData as OrderRow;
  const { data: showData, error: showError } = await supabase
    .from("shows")
    .select("*")
    .eq("id", orderRow.show_id)
    .maybeSingle();
  if (showError) throw new Error("SUPABASE_SHOW_LOOKUP_FAILED");
  if (!showData) return null;

  const order = mapOrder(orderRow);
  const show = mapSupabaseShow(showData as SupabaseShowRow);
  const { data: ticketData, error: ticketError } = await supabase
    .from("tickets")
    .select("*")
    .eq("order_id", order.id)
    .order("id");
  if (ticketError) throw new Error("SUPABASE_TICKET_LOOKUP_FAILED");

  return {
    order: {
      ...order,
      showTitle: show.title,
      showVenue: show.venue,
      showStartsAt: show.startsAt,
    },
    show,
    tickets: (ticketData as TicketRow[]).map(mapTicket),
  };
}

export async function listSupabaseOrdersForCurrentUser(): Promise<Array<{
  order: OrderWithShow;
  tickets: Ticket[];
}>> {
  const supabase = await createSupabaseServerClient();
  const user = await getSupabaseUser(supabase);
  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error("SUPABASE_ORDER_LOOKUP_FAILED");

  const records = await Promise.all(
    (data as OrderRow[]).map(async (row) => {
      const { data: showData, error: showError } = await supabase
        .from("shows")
        .select("*")
        .eq("id", row.show_id)
        .maybeSingle();
      if (showError) throw new Error("SUPABASE_SHOW_LOOKUP_FAILED");
      if (!showData) throw new Error("SUPABASE_SHOW_MISSING");

      const { data: ticketData, error: ticketError } = await supabase
        .from("tickets")
        .select("*")
        .eq("order_id", row.id)
        .order("id");
      if (ticketError) throw new Error("SUPABASE_TICKET_LOOKUP_FAILED");

      const order = mapOrder(row);
      const show = mapSupabaseShow(showData as SupabaseShowRow);
      return {
        order: {
          ...order,
          showTitle: show.title,
          showVenue: show.venue,
          showStartsAt: show.startsAt,
        },
        tickets: (ticketData as TicketRow[]).map(mapTicket),
      };
    })
  );

  return records;
}
