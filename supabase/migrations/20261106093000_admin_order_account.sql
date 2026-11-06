-- 管理端：订单关联注册账号（auth.users.email）可查可改

create or replace function public.admin_list_order_account_emails()
returns table(order_id bigint, account_email text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_ticketing_admin()) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  return query
  select o.id, u.email::text
  from public.orders o
  join auth.users u on u.id = o.user_id
  order by o.id;
end;
$$;

drop function if exists public.admin_update_ticket_order(text, text, text, text, integer, text, text, bigint);

create or replace function public.admin_update_ticket_order(
  p_order_code text,
  p_buyer_name text,
  p_phone text,
  p_contact_extra text,
  p_quantity integer,
  p_status text,
  p_admin_note text,
  p_show_id bigint default null,
  p_account_email text default null
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
  v_account_email text := nullif(lower(btrim(coalesce(p_account_email, ''))), '');
  v_user_id uuid;
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

  v_user_id := v_order.user_id;

  if v_account_email is not null then
    select u.id into v_user_id
    from auth.users u
    where lower(u.email) = v_account_email;

    if v_user_id is null then
      raise exception 'ACCOUNT_NOT_FOUND';
    end if;
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
  set user_id = v_user_id,
      buyer_name = btrim(p_buyer_name),
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

revoke all on function public.admin_list_order_account_emails() from public, anon;
revoke all on function public.admin_update_ticket_order(text, text, text, text, integer, text, text, bigint, text) from public, anon;

grant execute on function public.admin_list_order_account_emails() to authenticated;
grant execute on function public.admin_update_ticket_order(text, text, text, text, integer, text, text, bigint, text) to authenticated;
