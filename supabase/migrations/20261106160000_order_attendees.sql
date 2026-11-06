-- 入校政策：每位观众登记姓名、电话、证件号（不参与付款确认，可事后修改）

create table if not exists public.order_attendees (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders (id) on delete cascade,
  sort_index integer not null check (sort_index >= 1 and sort_index <= 5),
  full_name text not null,
  phone text not null,
  id_doc_type text not null check (id_doc_type in ('mainland_id', 'hk_home_return')),
  id_number text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, sort_index)
);

create index if not exists order_attendees_order_id_idx
  on public.order_attendees (order_id);

alter table public.order_attendees enable row level security;

drop policy if exists "Buyers and admins can view order attendees"
  on public.order_attendees;

create policy "Buyers and admins can view order attendees"
  on public.order_attendees for select to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_attendees.order_id
        and (
          o.user_id = (select auth.uid())
          or (select public.is_ticketing_admin())
        )
    )
  );

grant select on public.order_attendees to authenticated;

create or replace function public.save_order_attendees(
  p_order_code text,
  p_attendees jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_count integer;
  v_item jsonb;
  v_index integer;
  v_name text;
  v_phone text;
  v_doc_type text;
  v_id_number text;
  v_first_name text;
  v_first_phone text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_order
  from public.orders
  where code = upper(btrim(p_order_code))
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.user_id is distinct from auth.uid()
     and not (select public.is_ticketing_admin()) then
    raise exception 'ORDER_FORBIDDEN';
  end if;

  if v_order.status in ('cancelled', 'expired') then
    raise exception 'ORDER_CLOSED';
  end if;

  if p_attendees is null or jsonb_typeof(p_attendees) <> 'array' then
    raise exception 'ATTENDEES_REQUIRED';
  end if;

  v_count := jsonb_array_length(p_attendees);
  if v_count <> v_order.quantity then
    raise exception 'ATTENDEE_COUNT_MISMATCH';
  end if;

  for v_index in 0 .. v_count - 1 loop
    v_item := p_attendees -> v_index;
    v_name := nullif(btrim(coalesce(v_item ->> 'full_name', '')), '');
    v_phone := nullif(btrim(coalesce(v_item ->> 'phone', '')), '');
    v_doc_type := nullif(btrim(coalesce(v_item ->> 'id_doc_type', '')), '');
    v_id_number := nullif(upper(btrim(coalesce(v_item ->> 'id_number', ''))), '');

    if v_name is null or v_phone is null or v_doc_type is null or v_id_number is null then
      raise exception 'ATTENDEE_DETAILS_REQUIRED';
    end if;

    if v_doc_type not in ('mainland_id', 'hk_home_return') then
      raise exception 'BAD_ID_DOC_TYPE';
    end if;

    if v_index = 0 then
      v_first_name := v_name;
      v_first_phone := v_phone;
    end if;
  end loop;

  delete from public.order_attendees where order_id = v_order.id;

  for v_index in 0 .. v_count - 1 loop
    v_item := p_attendees -> v_index;
    insert into public.order_attendees (
      order_id,
      sort_index,
      full_name,
      phone,
      id_doc_type,
      id_number
    )
    values (
      v_order.id,
      v_index + 1,
      btrim(v_item ->> 'full_name'),
      btrim(v_item ->> 'phone'),
      btrim(v_item ->> 'id_doc_type'),
      upper(btrim(v_item ->> 'id_number'))
    );
  end loop;

  -- 订单联系字段与首位观众对齐，供付款备注 / 入场核对沿用
  update public.orders
  set buyer_name = v_first_name,
      phone = v_first_phone,
      updated_at = now()
  where id = v_order.id;
end;
$$;

revoke all on function public.save_order_attendees(text, jsonb) from public, anon;
grant execute on function public.save_order_attendees(text, jsonb) to authenticated;
