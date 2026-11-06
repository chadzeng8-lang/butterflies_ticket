-- 管理端：批量改状态、批量删除订单（先删票再删单）

create or replace function public.admin_bulk_set_order_status(
  p_order_codes text[],
  p_status text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_order public.orders%rowtype;
  v_show public.shows%rowtype;
  v_held integer;
  v_updated integer := 0;
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

  if p_order_codes is null or cardinality(p_order_codes) = 0 then
    raise exception 'NO_ORDERS_SELECTED';
  end if;

  foreach v_code in array p_order_codes loop
    select * into v_order
    from public.orders
    where code = upper(btrim(v_code))
    for update;

    if not found then
      continue;
    end if;

    select * into v_show
    from public.shows
    where id = v_order.show_id
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
      where show_id = v_order.show_id
        and id <> v_order.id
        and status in (
          'pending_payment',
          'pending_confirm',
          'issued',
          'checked_in',
          'deposit_refunded'
        );

      if v_order.quantity > (
        v_show.capacity
        - coalesce(v_show.internal_reserved, 0)
        - v_held
      ) then
        raise exception 'SOLD_OUT';
      end if;
    end if;

    update public.orders
    set status = p_status,
        confirmed_at = case
          when p_status in ('issued', 'checked_in', 'deposit_refunded')
            then coalesce(confirmed_at, now())
          else confirmed_at
        end,
        updated_at = now()
    where id = v_order.id;

    if p_status in ('issued', 'checked_in', 'deposit_refunded') then
      perform public.admin_ensure_order_tickets(v_order.id);
    end if;

    v_updated := v_updated + 1;
  end loop;

  return v_updated;
end;
$$;

create or replace function public.admin_bulk_delete_orders(
  p_order_codes text[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids bigint[];
  v_deleted integer := 0;
begin
  if not (select public.is_ticketing_admin()) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  if p_order_codes is null or cardinality(p_order_codes) = 0 then
    raise exception 'NO_ORDERS_SELECTED';
  end if;

  select coalesce(array_agg(o.id), '{}'::bigint[])
  into v_ids
  from public.orders o
  where o.code = any (
    select upper(btrim(c))
    from unnest(p_order_codes) as c
  );

  if cardinality(v_ids) = 0 then
    return 0;
  end if;

  delete from public.tickets
  where order_id = any (v_ids);

  delete from public.orders
  where id = any (v_ids);

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.admin_bulk_set_order_status(text[], text) from public, anon;
revoke all on function public.admin_bulk_delete_orders(text[]) from public, anon;

grant execute on function public.admin_bulk_set_order_status(text[], text) to authenticated;
grant execute on function public.admin_bulk_delete_orders(text[]) to authenticated;
