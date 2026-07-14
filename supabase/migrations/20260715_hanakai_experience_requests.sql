-- HANAKAI Ver1.1 — experience demand requests

create table if not exists public.experience_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null,
  category      text[] not null default '{}',
  prefecture    text not null,
  city          text not null,
  preferred_day text[] not null default '{}',
  age_group     text not null,
  comment       text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_experience_requests_created
  on public.experience_requests (created_at desc);

create index if not exists idx_experience_requests_location
  on public.experience_requests (prefecture, city);

alter table public.experience_requests enable row level security;

do $$ begin
  create policy "experience_requests_public_insert"
    on public.experience_requests for insert
    with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "experience_requests_select_own"
    on public.experience_requests for select
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
