create table if not exists public.datefi_interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  email text not null,
  status text not null default 'interested' check (status in ('interested')),
  created_at timestamptz not null default now(),
  constraint datefi_interests_unique_user unique (user_id)
);

create index if not exists idx_datefi_interests_created_at on public.datefi_interests(created_at desc);

alter table public.datefi_interests enable row level security;

drop policy if exists datefi_interests_select_self_or_admin on public.datefi_interests;
create policy datefi_interests_select_self_or_admin on public.datefi_interests
for select using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists datefi_interests_insert_self on public.datefi_interests;
create policy datefi_interests_insert_self on public.datefi_interests
for insert with check (auth.uid() = user_id);

drop policy if exists datefi_interests_update_admin_only on public.datefi_interests;
create policy datefi_interests_update_admin_only on public.datefi_interests
for update using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

