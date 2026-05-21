create table if not exists public.credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  balance int not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('purchase', 'consume', 'adjust')),
  amount int not null,
  reason text not null default '',
  related_match_id uuid,
  created_at timestamptz not null default now()
);

alter table public.credits enable row level security;
alter table public.credit_transactions enable row level security;

drop policy if exists credits_select_owner_or_admin on public.credits;
create policy credits_select_owner_or_admin on public.credits
for select using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists credits_insert_owner_or_admin on public.credits;
create policy credits_insert_owner_or_admin on public.credits
for insert with check (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists credits_update_owner_or_admin on public.credits;
create policy credits_update_owner_or_admin on public.credits
for update using (auth.uid() = user_id or is_admin(auth.uid()))
with check (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists credit_transactions_select_owner_or_admin on public.credit_transactions;
create policy credit_transactions_select_owner_or_admin on public.credit_transactions
for select using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists credit_transactions_insert_owner_or_admin on public.credit_transactions;
create policy credit_transactions_insert_owner_or_admin on public.credit_transactions
for insert with check (auth.uid() = user_id or is_admin(auth.uid()));
