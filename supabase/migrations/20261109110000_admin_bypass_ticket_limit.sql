-- 管理员下单不受每人/每单 5 张限制，仍受场次余票约束；普通用户规则不变。
-- 同时放宽 orders.quantity 上限，以便管理员可下一笔超过 5 张的订单。

alter table public.orders drop constraint if exists orders_quantity_check;

alter table public.orders
  add constraint orders_quantity_check check (quantity between 1 and 100);

create or replace function public.create_ticket_order(
  p_show_id bigint,
  p_buyer_name text,
  p_phone text,
  p_contact_extra text,
  p_quantity integer
)
returns table (order_id bigint, order_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_admin boolean := false;
  v_show public.shows%rowtype;
  v_active_seats integer;
  v_user_active_tickets integer;
  v_public_remaining integer;
  v_max_quantity integer;
  v_code text;
  v_attempt integer;
  v_order_id bigint;
  v_timeout_minutes integer := 45;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  v_is_admin := public.is_ticketing_admin();
  v_max_quantity := case when v_is_admin then 100 else 5 end;

  if p_quantity is null or p_quantity < 1 or p_quantity > v_max_quantity then
    raise exception 'BAD_QUANTITY';
  end if;

  if nullif(btrim(p_buyer_name), '') is null
    or nullif(btrim(p_phone), '') is null then
    raise exception 'BUYER_DETAILS_REQUIRED';
  end if;

  perform 1
  from public.profiles
  where id = v_user_id
  for update;

  select *
  into v_show
  from public.shows
  where id = p_show_id
  for update;

  if not found then
    raise exception 'SHOW_NOT_FOUND';
  end if;

  if not v_show.on_sale then
    raise exception 'SHOW_OFF_SALE';
  end if;

  update public.orders
  set status = 'expired', updated_at = now()
  where status = 'pending_payment'
    and expires_at < now();

  select coalesce(sum(quantity), 0)::integer
  into v_active_seats
  from public.orders
  where show_id = p_show_id
    and status in (
      'pending_payment',
      'pending_confirm',
      'issued',
      'checked_in',
      'deposit_refunded'
    );

  v_public_remaining := v_show.capacity - coalesce(v_show.internal_reserved, 0) - v_active_seats;

  if p_quantity > v_public_remaining then
    raise exception 'SOLD_OUT';
  end if;

  if not v_is_admin then
    select coalesce(sum(quantity), 0)::integer
    into v_user_active_tickets
    from public.orders
    where user_id = v_user_id
      and status in (
        'pending_payment',
        'pending_confirm',
        'issued',
        'checked_in',
        'deposit_refunded'
      );

    if v_user_active_tickets + p_quantity > 5 then
      raise exception 'PERSON_TICKET_LIMIT';
    end if;
  end if;

  for v_attempt in 1..10 loop
    v_code := 'MT-' ||
      substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::integer, 1) ||
      substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::integer, 1) ||
      substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::integer, 1) ||
      substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::integer, 1);
    exit when not exists (select 1 from public.orders where code = v_code);
  end loop;

  if exists (select 1 from public.orders where code = v_code) then
    raise exception 'ORDER_CODE_GENERATION_FAILED';
  end if;

  v_timeout_minutes := greatest(
    1,
    least(
      1440,
      coalesce(nullif(current_setting('app.payment_timeout_minutes', true), '')::integer, 45)
    )
  );

  insert into public.orders (
    code,
    user_id,
    show_id,
    buyer_name,
    phone,
    contact_extra,
    quantity,
    ticket_total_cents,
    deposit_total_cents,
    status,
    expires_at
  )
  values (
    v_code,
    v_user_id,
    p_show_id,
    btrim(p_buyer_name),
    btrim(p_phone),
    coalesce(btrim(p_contact_extra), ''),
    p_quantity,
    v_show.ticket_price_cents * p_quantity,
    v_show.deposit_cents * p_quantity,
    'pending_payment',
    now() + make_interval(mins => v_timeout_minutes)
  )
  returning id into v_order_id;

  return query select v_order_id, v_code;
end;
$$;
