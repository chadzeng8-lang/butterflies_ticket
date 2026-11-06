-- 管理端：列出注册账号，并将订单改绑到其他已注册电邮

create or replace function public.admin_list_accounts()
returns table(
  user_id uuid,
  email text,
  role text,
  full_name text,
  created_at timestamptz,
  order_count bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_ticketing_admin()) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  return query
  select
    u.id,
    u.email::text,
    coalesce(p.role, 'audience')::text,
    p.full_name,
    coalesce(p.created_at, u.created_at),
    (
      select count(*)::bigint
      from public.orders o
      where o.user_id = u.id
    ) as order_count
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by lower(u.email);
end;
$$;

create or replace function public.admin_rebind_order_account(
  p_order_code text,
  p_account_email text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_account_email text := nullif(lower(btrim(coalesce(p_account_email, ''))), '');
  v_user_id uuid;
begin
  if not (select public.is_ticketing_admin()) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  if v_account_email is null then
    raise exception 'ACCOUNT_NOT_FOUND';
  end if;

  select * into v_order
  from public.orders
  where code = upper(btrim(p_order_code))
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = v_account_email;

  if v_user_id is null then
    raise exception 'ACCOUNT_NOT_FOUND';
  end if;

  update public.orders
  set user_id = v_user_id,
      updated_at = now()
  where id = v_order.id;
end;
$$;

revoke all on function public.admin_list_accounts() from public, anon;
revoke all on function public.admin_rebind_order_account(text, text) from public, anon;

grant execute on function public.admin_list_accounts() to authenticated;
grant execute on function public.admin_rebind_order_account(text, text) to authenticated;
