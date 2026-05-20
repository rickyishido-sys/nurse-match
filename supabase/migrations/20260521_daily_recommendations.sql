create table if not exists public.daily_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  target_user_id uuid not null references public.users(id) on delete cascade,
  recommendation_date date not null,
  rank int not null check (rank between 1 and 10),
  reason text not null default '',
  created_at timestamptz not null default now(),
  constraint daily_recommendations_unique_rank unique (user_id, recommendation_date, rank),
  constraint daily_recommendations_unique_target unique (user_id, recommendation_date, target_user_id)
);

alter table public.daily_recommendations enable row level security;

drop policy if exists daily_recommendations_select_owner_or_admin on public.daily_recommendations;
create policy daily_recommendations_select_owner_or_admin on public.daily_recommendations
for select using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists daily_recommendations_insert_owner_or_admin on public.daily_recommendations;
create policy daily_recommendations_insert_owner_or_admin on public.daily_recommendations
for insert with check (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists daily_recommendations_delete_owner_or_admin on public.daily_recommendations;
create policy daily_recommendations_delete_owner_or_admin on public.daily_recommendations
for delete using (auth.uid() = user_id or is_admin(auth.uid()));
