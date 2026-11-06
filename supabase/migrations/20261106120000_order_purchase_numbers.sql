-- 观众端可读：按场次下单顺序计算购票编号（从 1 起）

create or replace function public.get_order_purchase_numbers(
  p_show_ids bigint[]
)
returns table(order_id bigint, purchase_no integer)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_show_ids is null or cardinality(p_show_ids) = 0 then
    return;
  end if;

  return query
  select
    ranked.id,
    ranked.purchase_no::integer
  from (
    select
      o.id,
      row_number() over (
        partition by o.show_id
        order by o.created_at asc, o.id asc
      ) as purchase_no
    from public.orders o
    where o.show_id = any (p_show_ids)
  ) ranked;
end;
$$;

create or replace function public.get_orders_purchase_info(
  p_order_ids bigint[]
)
returns table(order_id bigint, show_id bigint, phone text, purchase_no integer)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_order_ids is null or cardinality(p_order_ids) = 0 then
    return;
  end if;

  return query
  with target as (
    select o.id, o.show_id, o.phone
    from public.orders o
    where o.id = any (p_order_ids)
  ),
  ranked as (
    select
      o.id,
      o.show_id,
      o.phone,
      row_number() over (
        partition by o.show_id
        order by o.created_at asc, o.id asc
      ) as purchase_no
    from public.orders o
    where o.show_id in (select distinct t.show_id from target t)
  )
  select r.id, r.show_id, r.phone, r.purchase_no::integer
  from ranked r
  join target t on t.id = r.id;
end;
$$;

revoke all on function public.get_order_purchase_numbers(bigint[]) from public;
revoke all on function public.get_orders_purchase_info(bigint[]) from public;
grant execute on function public.get_order_purchase_numbers(bigint[]) to anon, authenticated;
grant execute on function public.get_orders_purchase_info(bigint[]) to anon, authenticated;
