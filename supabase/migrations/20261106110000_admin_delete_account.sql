-- 管理端：删除注册账号（连同其订单与票；不可删除自己）

create or replace function public.admin_delete_account(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_ids bigint[];
begin
  if not (select public.is_ticketing_admin()) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  if p_user_id is null then
    raise exception 'ACCOUNT_NOT_FOUND';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'CANNOT_DELETE_SELF';
  end if;

  if not exists (select 1 from auth.users u where u.id = p_user_id) then
    raise exception 'ACCOUNT_NOT_FOUND';
  end if;

  select coalesce(array_agg(o.id), '{}'::bigint[])
  into v_order_ids
  from public.orders o
  where o.user_id = p_user_id;

  if cardinality(v_order_ids) > 0 then
    delete from public.tickets
    where order_id = any (v_order_ids);

    delete from public.orders
    where id = any (v_order_ids);
  end if;

  delete from auth.users
  where id = p_user_id;
end;
$$;

revoke all on function public.admin_delete_account(uuid) from public, anon;
grant execute on function public.admin_delete_account(uuid) to authenticated;
