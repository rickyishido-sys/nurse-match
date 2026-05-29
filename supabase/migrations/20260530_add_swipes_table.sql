create table if not exists public.swipes (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.users(id) on delete cascade,
  to_user_id uuid not null references public.users(id) on delete cascade,
  action text not null check (action in ('like', 'skip')),
  created_at timestamptz not null default now(),
  constraint swipes_unique_pair unique (from_user_id, to_user_id),
  constraint swipes_not_self check (from_user_id <> to_user_id)
);

create index if not exists idx_swipes_from_user on public.swipes(from_user_id, created_at desc);
create index if not exists idx_swipes_to_user on public.swipes(to_user_id, created_at desc);

alter table public.swipes enable row level security;

drop policy if exists swipes_select_self_or_admin on public.swipes;
create policy swipes_select_self_or_admin on public.swipes
for select using (auth.uid() = from_user_id or auth.uid() = to_user_id or is_admin(auth.uid()));

drop policy if exists swipes_insert_from_user on public.swipes;
create policy swipes_insert_from_user on public.swipes
for insert with check (auth.uid() = from_user_id);

drop policy if exists swipes_update_from_user_or_admin on public.swipes;
create policy swipes_update_from_user_or_admin on public.swipes
for update using (auth.uid() = from_user_id or is_admin(auth.uid()))
with check (auth.uid() = from_user_id or is_admin(auth.uid()));

