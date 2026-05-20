alter table public.users
  add column if not exists risk_check_status text not null default 'not_checked';

alter table public.users
  drop constraint if exists users_risk_check_status_check;
alter table public.users
  add constraint users_risk_check_status_check
  check (risk_check_status in ('not_checked', 'checking', 'clear', 'review_required', 'rejected'));

update public.users
set risk_check_status = 'clear'
where verification_status = 'approved'
  and risk_check_status = 'not_checked';

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  target_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_unique_pair unique (user_id, target_user_id),
  constraint favorites_not_self check (user_id <> target_user_id)
);

create table if not exists public.risk_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  status text not null check (status in ('not_checked', 'checking', 'clear', 'review_required', 'rejected')),
  searched_at timestamptz not null default now(),
  search_keywords text[] not null default '{}',
  hit_count int not null default 0,
  source_urls text[] not null default '{}',
  admin_memo text,
  final_decider_id uuid references public.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.favorites enable row level security;
alter table public.risk_checks enable row level security;

drop policy if exists favorites_select_owner on public.favorites;
create policy favorites_select_owner on public.favorites
for select using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists favorites_insert_owner on public.favorites;
create policy favorites_insert_owner on public.favorites
for insert with check (auth.uid() = user_id);

drop policy if exists favorites_delete_owner on public.favorites;
create policy favorites_delete_owner on public.favorites
for delete using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists risk_checks_select_self_or_admin on public.risk_checks;
create policy risk_checks_select_self_or_admin on public.risk_checks
for select using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists risk_checks_insert_admin_only on public.risk_checks;
create policy risk_checks_insert_admin_only on public.risk_checks
for insert with check (is_admin(auth.uid()));

drop policy if exists risk_checks_update_admin_only on public.risk_checks;
create policy risk_checks_update_admin_only on public.risk_checks
for update using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
