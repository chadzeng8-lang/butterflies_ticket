create or replace function public.lookup_ticket_orders(
  p_buyer_name text,
  p_contact text
)
returns table (
  id bigint,
  code text,
  status text,
  show_title text,
  show_starts_at timestamptz,
  show_venue text,
  quantity integer,
  ticket_total_cents integer,
  deposit_total_cents integer,
  tickets jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    o.id,
    o.code,
    o.status,
    s.title,
    s.starts_at,
    s.venue,
    o.quantity,
    o.ticket_total_cents,
    o.deposit_total_cents,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'code', t.code,
          'checked_in_at', t.checked_in_at,
          'deposit_refunded_at', t.deposit_refunded_at
        )
        order by t.id
      ) filter (where t.id is not null),
      '[]'::jsonb
    )
  from public.orders as o
  join public.shows as s on s.id = o.show_id
  left join public.tickets as t on t.order_id = o.id
  where length(btrim(coalesce(p_buyer_name, ''))) between 1 and 100
    and length(btrim(coalesce(p_contact, ''))) between 1 and 320
    and lower(btrim(o.buyer_name)) = lower(btrim(p_buyer_name))
    and (
      (
        btrim(p_contact) ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
        and lower(btrim(o.contact_extra)) = lower(btrim(p_contact))
      )
      or (
        regexp_replace(btrim(p_contact), '[^0-9]', '', 'g') <> ''
        and regexp_replace(o.phone, '[^0-9]', '', 'g')
          = regexp_replace(btrim(p_contact), '[^0-9]', '', 'g')
      )
    )
  group by o.id, s.id
  order by max(o.created_at) desc;
$$;

revoke all on function public.lookup_ticket_orders(text, text)
  from public, anon, authenticated;
grant execute on function public.lookup_ticket_orders(text, text)
  to anon, authenticated;
