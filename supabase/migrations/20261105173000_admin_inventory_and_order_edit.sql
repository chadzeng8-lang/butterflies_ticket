-- 依赖：shows.internal_reserved（20261105170000）。若尚未执行请先跑上一份迁移。

create or replace function public.admin_update_show_inventory(
  p_show_id bigint,
  p_capacity integer,
  p_internal_reserved integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_held integer;
begin
  if not (select public.is_ticketing_admin()) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  if p_capacity is null or p_capacity < 1 then
    raise exception 'BAD_CAPACITY';
  end if;

  if p_internal_reserved is null or p_internal_reserved < 0 then
    raise exception 'BAD_INTERNAL_RESERVED';
  end if;

  if p_internal_reserved > p_capacity then
    raise exception 'INTERNAL_GT_CAPACITY';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'shows'
      and column_name = 'internal_reserved'
  ) then
    raise exception 'MIGRATION_REQUIRED';
  end if;

  select coalesce(sum(quantity), 0)::integer
  into v_held
  from public.orders
  where show_id = p_show_id
    and status in (
      'pending_payment',
      'pending_confirm',
      'issued',
      'checked_in',
      'deposit_refunded'
    );

  if p_capacity - p_internal_reserved < v_held then
    raise exception 'PUBLIC_REMAINING_NEGATIVE';
  end if;

  update public.shows
  set capacity = p_capacity,
      internal_reserved = p_internal_reserved,
      updated_at = now()
  where id = p_show_id;

  if not found then
    raise exception 'SHOW_NOT_FOUND';
  end if;
end;
$$;

create or replace function public.admin_ensure_order_tickets(p_order_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_existing integer;
  v_need integer;
  v_ticket_code text;
  v_attempt integer;
  v_retry integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  select count(*)::integer into v_existing
  from public.tickets
  where order_id = p_order_id;

  if v_order.status in ('issued', 'checked_in', 'deposit_refunded') then
    v_need := greatest(0, v_order.quantity - v_existing);
    for v_attempt in 1..v_need loop
      for v_retry in 1..10 loop
        v_ticket_code := 'T-' ||
          substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::integer, 1) ||
          substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::integer, 1) ||
          substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::integer, 1) ||
          substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::integer, 1) ||
          substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::integer, 1) ||
          substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::integer, 1);
        exit when not exists (select 1 from public.tickets where code = v_ticket_code);
      end loop;
      if exists (select 1 from public.tickets where code = v_ticket_code) then
        raise exception 'TICKET_CODE_GENERATION_FAILED';
      end if;
      insert into public.tickets (order_id, code) values (p_order_id, v_ticket_code);
    end loop;
  end if;
end;
$$;

create or replace function public.admin_update_ticket_order(
  p_order_code text,
  p_buyer_name text,
  p_phone text,
  p_contact_extra text,
  p_quantity integer,
  p_status text,
  p_admin_note text,
  p_show_id bigint default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_show public.shows%rowtype;
  v_show_id bigint;
  v_held integer;
  v_ticket_count integer;
begin
  if not (select public.is_ticketing_admin()) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  if p_status not in (
    'pending_payment',
    'pending_confirm',
    'issued',
    'checked_in',
    'deposit_refunded',
    'cancelled',
    'expired'
  ) then
    raise exception 'BAD_ORDER_STATUS';
  end if;

  if p_quantity is null or p_quantity < 1 or p_quantity > 20 then
    raise exception 'BAD_QUANTITY';
  end if;

  if nullif(btrim(p_buyer_name), '') is null or nullif(btrim(p_phone), '') is null then
    raise exception 'BUYER_DETAILS_REQUIRED';
  end if;

  select * into v_order
  from public.orders
  where code = upper(btrim(p_order_code))
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  v_show_id := coalesce(p_show_id, v_order.show_id);

  select * into v_show
  from public.shows
  where id = v_show_id
  for update;

  if not found then
    raise exception 'SHOW_NOT_FOUND';
  end if;

  if p_status in (
    'pending_payment',
    'pending_confirm',
    'issued',
    'checked_in',
    'deposit_refunded'
  ) then
    select coalesce(sum(quantity), 0)::integer into v_held
    from public.orders
    where show_id = v_show_id
      and id <> v_order.id
      and status in (
        'pending_payment',
        'pending_confirm',
        'issued',
        'checked_in',
        'deposit_refunded'
      );

    if p_quantity > (
      v_show.capacity
      - coalesce(v_show.internal_reserved, 0)
      - v_held
    ) then
      raise exception 'SOLD_OUT';
    end if;
  end if;

  update public.orders
  set buyer_name = btrim(p_buyer_name),
      phone = btrim(p_phone),
      contact_extra = coalesce(btrim(p_contact_extra), ''),
      quantity = p_quantity,
      show_id = v_show_id,
      ticket_total_cents = v_show.ticket_price_cents * p_quantity,
      deposit_total_cents = v_show.deposit_cents * p_quantity,
      status = p_status,
      admin_note = coalesce(p_admin_note, ''),
      confirmed_at = case
        when p_status in ('issued', 'checked_in', 'deposit_refunded')
          then coalesce(v_order.confirmed_at, now())
        else v_order.confirmed_at
      end,
      updated_at = now()
  where id = v_order.id;

  select count(*)::integer into v_ticket_count
  from public.tickets
  where order_id = v_order.id;

  if p_status in ('issued', 'checked_in', 'deposit_refunded') then
    perform public.admin_ensure_order_tickets(v_order.id);
  end if;

  if p_status in ('cancelled', 'expired') and v_ticket_count > 0 then
    -- 保留票码记录，仅改订单状态；现场可据此识别已取消
    null;
  elsif p_quantity < v_ticket_count then
    delete from public.tickets
    where id in (
      select id
      from public.tickets
      where order_id = v_order.id
        and checked_in_at is null
        and deposit_refunded_at is null
      order by id desc
      limit (v_ticket_count - p_quantity)
    );
  end if;
end;
$$;

revoke all on function public.admin_update_show_inventory(bigint, integer, integer) from public, anon;
revoke all on function public.admin_ensure_order_tickets(bigint) from public, anon;
revoke all on function public.admin_update_ticket_order(text, text, text, text, integer, text, text, bigint) from public, anon;

grant execute on function public.admin_update_show_inventory(bigint, integer, integer) to authenticated;
grant execute on function public.admin_ensure_order_tickets(bigint) to authenticated;
grant execute on function public.admin_update_ticket_order(text, text, text, text, integer, text, text, bigint) to authenticated;
