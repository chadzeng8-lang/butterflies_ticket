-- 周日校内场观众可填学号：扩展 id_doc_type 允许 student_id

alter table public.order_attendees
  drop constraint if exists order_attendees_id_doc_type_check;

alter table public.order_attendees
  add constraint order_attendees_id_doc_type_check
  check (id_doc_type in ('mainland_id', 'hk_home_return', 'student_id'));

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

    if v_doc_type not in ('mainland_id', 'hk_home_return', 'student_id') then
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
