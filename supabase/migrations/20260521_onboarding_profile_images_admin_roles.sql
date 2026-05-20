alter table public.users
  drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check
  check (role in ('user', 'female_admin', 'male_admin', 'super_admin'));

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists(select 1 from public.users where id = uid and role in ('female_admin', 'male_admin', 'super_admin'));
$$;

alter table public.users
  add column if not exists onboarding_status text not null default 'provisional';
alter table public.users
  drop constraint if exists users_onboarding_status_check;
alter table public.users
  add constraint users_onboarding_status_check
  check (onboarding_status in ('provisional', 'profile_completed', 'verified'));

create table if not exists public.profile_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 1 check (sort_order between 1 and 3),
  is_main boolean not null default false,
  approved_status text not null default 'pending' check (approved_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  constraint profile_images_unique_order unique (user_id, sort_order)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.users(id) on delete cascade,
  target_user_id uuid references public.users(id) on delete set null,
  action text not null check (action in ('approve', 'reject', 'suspend', 'permanent_ban', 'image_reject', 'deletion_hold')),
  reason text,
  created_at timestamptz not null default now()
);

alter table public.profile_images enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists profile_images_select_self_or_admin on public.profile_images;
create policy profile_images_select_self_or_admin on public.profile_images
for select using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists profile_images_insert_self on public.profile_images;
create policy profile_images_insert_self on public.profile_images
for insert with check (auth.uid() = user_id);

drop policy if exists profile_images_update_self_or_admin on public.profile_images;
create policy profile_images_update_self_or_admin on public.profile_images
for update using (auth.uid() = user_id or is_admin(auth.uid())) with check (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists admin_audit_logs_select_admin_only on public.admin_audit_logs;
create policy admin_audit_logs_select_admin_only on public.admin_audit_logs
for select using (is_admin(auth.uid()));

drop policy if exists admin_audit_logs_insert_admin_only on public.admin_audit_logs;
create policy admin_audit_logs_insert_admin_only on public.admin_audit_logs
for insert with check (is_admin(auth.uid()));
