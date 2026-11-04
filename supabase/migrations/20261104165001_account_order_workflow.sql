insert into public.shows (
  id,
  title,
  description,
  venue,
  starts_at,
  capacity,
  ticket_price_cents,
  deposit_cents,
  on_sale,
  payment_note
)
values
  (
    1,
    '香港中文大学音乐剧社年度大戏《蝶》沉浸版展演',
    '香港中文大学音乐剧社年度大戏《蝶》沉浸版展演（公益演出）。不收票价，仅收按金 ¥50；到场核销后全额退还，未到场不退。转账请务必备注订单号。',
    '香港中文大学（深圳）时光胶囊黑匣子',
    '2026-11-21 19:30:00+08',
    50,
    0,
    5000,
    true,
    '公益演出仅收按金 ¥50/人，到场全额退还。可用微信 / 支付宝转账，备注填写订单号（如 MT-A7K2）。'
  ),
  (
    2,
    '香港中文大学音乐剧社年度大戏《蝶》沉浸版展演',
    '香港中文大学音乐剧社年度大戏《蝶》沉浸版展演（公益演出）。不收票价，仅收按金 ¥50；到场核销后全额退还，未到场不退。转账请务必备注订单号。',
    '香港中文大学（深圳）时光胶囊黑匣子',
    '2026-11-22 14:30:00+08',
    50,
    0,
    5000,
    true,
    '公益演出仅收按金 ¥50/人，到场全额退还。可用微信 / 支付宝转账，备注填写订单号（如 MT-A7K2）。'
  )
on conflict (id) do nothing;

alter table public.orders
  add column if not exists email_sent_at timestamptz;

select setval(
  pg_get_serial_sequence('public.shows', 'id'),
  greatest((select coalesce(max(id), 1) from public.shows), 1),
  true
);

create or replace function public.submit_ticket_payment(
  p_order_code text,
  p_payment_proof_path text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_payment_proof_path is not null
    and (storage.foldername(p_payment_proof_path))[1] <> v_user_id::text then
    raise exception 'BAD_PAYMENT_PROOF_PATH';
  end if;

  update public.orders
  set status = 'pending_confirm',
      payment_proof_path = p_payment_proof_path,
      updated_at = now()
  where code = p_order_code
    and user_id = v_user_id
    and status = 'pending_payment'
    and expires_at > now();

  if not found then
    raise exception 'ORDER_NOT_PAYABLE';
  end if;
end;
$$;

revoke all on function public.submit_ticket_payment(text, text) from public, anon;
grant execute on function public.submit_ticket_payment(text, text) to authenticated;

create or replace function public.confirm_ticket_order(p_order_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_ticket_code text;
  v_attempt integer;
  v_retry integer;
begin
  if not (select public.is_ticketing_admin()) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  select *
  into v_order
  from public.orders
  where code = p_order_code
  for update;

  if not found or v_order.status <> 'pending_confirm' then
    raise exception 'ORDER_NOT_CONFIRMABLE';
  end if;

  update public.orders
  set status = 'issued',
      confirmed_at = now(),
      updated_at = now()
  where id = v_order.id;

  for v_attempt in 1..v_order.quantity loop
    for v_retry in 1..10 loop
      v_ticket_code := 'T-' ||
        substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::integer, 1) ||
        substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::integer, 1) ||
        substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::integer, 1) ||
        substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::integer, 1) ||
        substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::integer, 1) ||
        substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32 + 1)::integer, 1);
      exit when not exists (
        select 1 from public.tickets where code = v_ticket_code
      );
    end loop;
    if exists (select 1 from public.tickets where code = v_ticket_code) then
      raise exception 'TICKET_CODE_GENERATION_FAILED';
    end if;

    insert into public.tickets (order_id, code)
    values (v_order.id, v_ticket_code);
  end loop;
end;
$$;

create or replace function public.close_ticket_order(
  p_order_code text,
  p_status text,
  p_admin_note text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_ticketing_admin()) then
    raise exception 'ADMIN_REQUIRED';
  end if;
  if p_status not in ('cancelled', 'expired') then
    raise exception 'BAD_ORDER_STATUS';
  end if;

  update public.orders
  set status = p_status,
      admin_note = coalesce(p_admin_note, ''),
      updated_at = now()
  where code = p_order_code
    and status in ('pending_payment', 'pending_confirm');

  if not found then
    raise exception 'ORDER_NOT_CLOSABLE';
  end if;
end;
$$;

revoke all on function public.confirm_ticket_order(text) from public, anon;
revoke all on function public.close_ticket_order(text, text, text) from public, anon;
grant execute on function public.confirm_ticket_order(text) to authenticated;
grant execute on function public.close_ticket_order(text, text, text) to authenticated;

create or replace function public.mark_ticket_email_sent(p_order_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_ticketing_admin()) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  update public.orders
  set email_sent_at = now(),
      updated_at = now()
  where code = p_order_code
    and status in ('issued', 'checked_in', 'deposit_refunded');

  if not found then
    raise exception 'ORDER_NOT_ISSUED';
  end if;
end;
$$;

revoke all on function public.mark_ticket_email_sent(text) from public, anon;
grant execute on function public.mark_ticket_email_sent(text) to authenticated;
