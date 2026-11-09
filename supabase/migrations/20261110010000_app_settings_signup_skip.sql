-- 全站可配置开关：注册是否跳过邮箱验证（管理员在 /account 一键切换）

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default 'false'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

insert into public.app_settings (key, value)
values ('signup_skip_email_confirm', 'false'::jsonb)
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "Anyone can read app settings" on public.app_settings;
create policy "Anyone can read app settings"
  on public.app_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can upsert app settings" on public.app_settings;
create policy "Admins can upsert app settings"
  on public.app_settings for all
  to authenticated
  using (public.is_ticketing_admin())
  with check (public.is_ticketing_admin());

grant select on public.app_settings to anon, authenticated;
grant insert, update, delete on public.app_settings to authenticated;
