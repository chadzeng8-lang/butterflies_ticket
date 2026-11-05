alter table public.orders
  add column if not exists email_sent_at timestamptz;

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
