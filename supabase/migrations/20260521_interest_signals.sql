create table if not exists public.interest_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  target_user_id uuid not null references public.users(id) on delete cascade,
  signal_type text not null check (signal_type in ('interested', 'skipped')),
  matched_preference boolean not null default false,
  reason text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint interest_signals_not_self check (user_id <> target_user_id)
);

alter table public.interest_signals enable row level security;

drop policy if exists interest_signals_select_owner_or_admin on public.interest_signals;
create policy interest_signals_select_owner_or_admin on public.interest_signals
for select using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists interest_signals_insert_owner on public.interest_signals;
create policy interest_signals_insert_owner on public.interest_signals
for insert with check (auth.uid() = user_id);

drop policy if exists interest_signals_delete_owner_or_admin on public.interest_signals;
create policy interest_signals_delete_owner_or_admin on public.interest_signals
for delete using (auth.uid() = user_id or is_admin(auth.uid()));
