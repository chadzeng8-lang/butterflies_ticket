create table public.personality_results (
  user_id uuid primary key references auth.users (id) on delete cascade,
  personality_type text not null check (
    personality_type ~ '^[EI][SN][TF][JP]$'
  ),
  result_key text not null check (
    result_key in (
      'ENFP',
      'INFP',
      'ESFP',
      'ESTJ',
      'INTJ',
      'ISFP',
      'ENTJ',
      'ISFJ'
    )
  ),
  answers jsonb not null check (
    jsonb_typeof(answers) = 'array'
    and jsonb_array_length(answers) = 24
  ),
  tested_at timestamptz not null default now()
);

alter table public.personality_results enable row level security;

create policy "Users can view their own personality result"
  on public.personality_results for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own personality result"
  on public.personality_results for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own personality result"
  on public.personality_results for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.personality_results to authenticated;
