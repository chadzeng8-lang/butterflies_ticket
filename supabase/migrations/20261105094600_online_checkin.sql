create or replace function public.checkin_ticket(
  p_ticket_code text,
  p_refunded_by text default ''
)
returns table (
  ticket_code text,
  buyer_name text,
  phone text,
  show_title text,
  quantity integer,
  deposit_cents integer,
  already_checked_in boolean,
  already_refunded boolean,
  order_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.tickets%rowtype;
  v_order public.orders%rowtype;
  v_show public.shows%rowtype;
  v_now timestamptz := now();
  v_checked_count integer;
  v_refunded_count integer;
begin
  if not (select public.is_ticketing_admin()) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  select *
  into v_ticket
  from public.tickets
  where code = p_ticket_code
  for update;
  if not found then
    raise exception 'TICKET_NOT_FOUND';
  end if;

  select *
  into v_order
  from public.orders
  where id = v_ticket.order_id
  for update;
  if not found or v_order.status not in (
    'issued',
    'checked_in',
    'deposit_refunded'
  ) then
    raise exception 'ORDER_NOT_ISSUED';
  end if;

  select *
  into v_show
  from public.shows
  where id = v_order.show_id;
  if not found then
    raise exception 'SHOW_NOT_FOUND';
  end if;

  ticket_code := v_ticket.code;
  buyer_name := v_order.buyer_name;
  phone := v_order.phone;
  show_title := v_show.title;
  quantity := v_order.quantity;
  deposit_cents := v_show.deposit_cents;
  already_checked_in := v_ticket.checked_in_at is not null;
  already_refunded := v_ticket.deposit_refunded_at is not null;

  update public.tickets
  set checked_in_at = coalesce(checked_in_at, v_now),
      deposit_refunded_at = coalesce(deposit_refunded_at, v_now),
      refunded_by = coalesce(nullif(btrim(p_refunded_by), ''), refunded_by)
  where id = v_ticket.id;

  select count(*) filter (where checked_in_at is not null),
         count(*) filter (where deposit_refunded_at is not null)
  into v_checked_count, v_refunded_count
  from public.tickets
  where order_id = v_order.id;

  if v_refunded_count = v_order.quantity then
    v_order.status := 'deposit_refunded';
  elsif v_checked_count = v_order.quantity then
    v_order.status := 'checked_in';
  end if;

  update public.orders
  set status = v_order.status,
      updated_at = v_now
  where id = v_order.id;

  order_status := v_order.status;
  return next;
end;
$$;

revoke all on function public.checkin_ticket(text, text) from public, anon;
grant execute on function public.checkin_ticket(text, text) to authenticated;
