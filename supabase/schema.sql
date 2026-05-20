-- Nurse Match beta MVP schema (Supabase production)
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'user' check (role in ('user', 'female_admin', 'male_admin', 'super_admin')),
  gender text not null check (gender in ('female', 'male')),
  nickname text not null,
  birthdate date not null,
  age int not null check (age >= 18),
  location text not null,
  bio text not null default '',
  profile_image_url text not null default '',
  desired_gender text not null default 'both' check (desired_gender in ('male', 'female', 'both')),
  onboarding_status text not null default 'provisional' check (onboarding_status in ('provisional', 'profile_completed', 'verified')),
  risk_check_status text not null default 'not_checked' check (risk_check_status in ('not_checked', 'checking', 'clear', 'review_required', 'rejected')),
  verification_status text not null default 'pending' check (verification_status in ('pending', 'approved', 'rejected')),
  identity_document_url text,
  rejected_reason text,
  moderation_action text not null default 'none' check (moderation_action in ('none', 'warning', 'suspend', 'permanent_ban')),
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists female_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  nurse_document_url text not null,
  nurse_verification_status text not null default 'pending' check (nurse_verification_status in ('pending', 'approved', 'rejected')),
  workplace_type text not null check (workplace_type in ('hospital', 'clinic', 'beauty', 'nightshift', 'other')),
  has_night_shift boolean not null default false
);

create table if not exists male_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  job text not null,
  income text not null,
  marital_status text not null check (marital_status in ('single', 'married', 'divorced', 'partner')),
  has_children boolean not null default false,
  male_review_status text not null default 'pending' check (male_review_status in ('pending', 'approved', 'rejected')),
  income_verified boolean not null default false,
  face_photo_verified boolean not null default false,
  internal_memo text,
  height int,
  body_type text,
  holiday text,
  smoking text,
  drinking text,
  night_shift_understanding boolean not null default false,
  shift_work_understanding boolean not null default false,
  late_night_contact_ok boolean not null default false,
  first_date_cost text,
  personality_tags text[] not null default '{}'
);

create table if not exists identity_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  document_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists profile_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 1 check (sort_order between 1 and 3),
  is_main boolean not null default false,
  approved_status text not null default 'pending' check (approved_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  constraint profile_images_unique_order unique (user_id, sort_order)
);

create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references users(id) on delete cascade,
  to_user_id uuid not null references users(id) on delete cascade,
  status text not null check (status in ('like', 'skip')),
  created_at timestamptz not null default now(),
  unique (from_user_id, to_user_id)
);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  target_user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_unique_pair unique (user_id, target_user_id),
  constraint favorites_not_self check (user_id <> target_user_id)
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references users(id) on delete cascade,
  user_b_id uuid not null references users(id) on delete cascade,
  relationship_status text not null default 'active' check (relationship_status in ('active', 'relationship_mode', 'scheduled_delete', 'deleted')),
  relationship_started_at timestamptz,
  scheduled_delete_at timestamptz,
  hold_deletion boolean not null default false,
  created_at timestamptz not null default now(),
  constraint different_users check (user_a_id <> user_b_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  sender_id uuid not null references users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references users(id) on delete cascade,
  target_user_id uuid not null references users(id) on delete cascade,
  reason text not null,
  reason_type text not null default 'other' check (reason_type in ('fake_marital_status', 'harassment', 'dangerous', 'fake_profile', 'spam', 'other')),
  detail text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_user_id uuid not null references users(id) on delete cascade,
  blocked_user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint blocks_unique_pair unique (blocker_user_id, blocked_user_id),
  constraint blocks_not_self check (blocker_user_id <> blocked_user_id)
);

create table if not exists admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references users(id) on delete cascade,
  target_user_id uuid not null references users(id) on delete cascade,
  action_type text not null check (
    action_type in (
      'verification_status_changed',
      'nurse_verification_status_changed',
      'male_review_status_changed',
      'user_suspended',
      'user_permanent_banned',
      'rejected_reason_updated',
      'internal_memo_updated'
    )
  ),
  before_value text,
  after_value text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references users(id) on delete cascade,
  target_user_id uuid references users(id) on delete set null,
  action text not null check (action in ('approve', 'reject', 'suspend', 'permanent_ban', 'image_reject', 'deletion_hold')),
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists risk_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  status text not null check (status in ('not_checked', 'checking', 'clear', 'review_required', 'rejected')),
  searched_at timestamptz not null default now(),
  search_keywords text[] not null default '{}',
  hit_count int not null default 0,
  source_urls text[] not null default '{}',
  admin_memo text,
  final_decider_id uuid references users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_verification on users(verification_status, is_suspended);
create index if not exists idx_likes_from on likes(from_user_id);
create index if not exists idx_matches_users on matches(user_a_id, user_b_id);
create index if not exists idx_messages_match on messages(match_id, created_at);

create or replace view public_user_cards as
select
  u.id,
  u.gender,
  u.nickname,
  u.age,
  u.location,
  u.bio,
  u.profile_image_url,
  u.desired_gender,
  u.verification_status,
  u.is_suspended
from users u;

create or replace view female_profile_public as
select
  fp.user_id,
  fp.nurse_verification_status,
  fp.workplace_type,
  fp.has_night_shift
from female_profiles fp;

create or replace view male_profile_public as
select
  mp.user_id,
  mp.job,
  mp.income,
  mp.marital_status,
  mp.has_children,
  mp.male_review_status,
  mp.income_verified,
  mp.face_photo_verified,
  mp.height,
  mp.body_type,
  mp.holiday,
  mp.smoking,
  mp.drinking,
  mp.night_shift_understanding,
  mp.shift_work_understanding,
  mp.late_night_contact_ok,
  mp.first_date_cost,
  mp.personality_tags
from male_profiles mp;

grant select on public_user_cards to authenticated;
grant select on female_profile_public to authenticated;
grant select on male_profile_public to authenticated;

alter table users enable row level security;
alter table female_profiles enable row level security;
alter table male_profiles enable row level security;
alter table identity_documents enable row level security;
alter table profile_images enable row level security;
alter table likes enable row level security;
alter table favorites enable row level security;
alter table matches enable row level security;
alter table messages enable row level security;
alter table reports enable row level security;
alter table blocks enable row level security;
alter table admin_actions enable row level security;
alter table admin_audit_logs enable row level security;
alter table risk_checks enable row level security;

-- Helper
create or replace function is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists(select 1 from users where id = uid and role in ('female_admin', 'male_admin', 'super_admin'));
$$;

-- users policies
drop policy if exists users_select_self_or_admin on users;
create policy users_select_self_or_admin on users
for select using (auth.uid() = id or is_admin(auth.uid()));

drop policy if exists users_insert_self on users;
create policy users_insert_self on users
for insert with check (auth.uid() = id);

drop policy if exists users_update_self_or_admin on users;
create policy users_update_self_or_admin on users
for update using (auth.uid() = id or is_admin(auth.uid())) with check (auth.uid() = id or is_admin(auth.uid()));

-- female_profiles policies
drop policy if exists female_select_self_or_admin on female_profiles;
create policy female_select_self_or_admin on female_profiles
for select using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists female_insert_self on female_profiles;
create policy female_insert_self on female_profiles
for insert with check (auth.uid() = user_id);

drop policy if exists female_update_self_or_admin on female_profiles;
create policy female_update_self_or_admin on female_profiles
for update using (auth.uid() = user_id or is_admin(auth.uid())) with check (auth.uid() = user_id or is_admin(auth.uid()));

-- male_profiles policies
drop policy if exists male_select_self_or_admin on male_profiles;
create policy male_select_self_or_admin on male_profiles
for select using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists male_insert_self on male_profiles;
create policy male_insert_self on male_profiles
for insert with check (auth.uid() = user_id);

drop policy if exists male_update_self_or_admin on male_profiles;
create policy male_update_self_or_admin on male_profiles
for update using (auth.uid() = user_id or is_admin(auth.uid())) with check (auth.uid() = user_id or is_admin(auth.uid()));

-- identity_documents policies (書類URLは本人/管理者のみ)
drop policy if exists identity_select_self_or_admin on identity_documents;
create policy identity_select_self_or_admin on identity_documents
for select using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists identity_insert_self on identity_documents;
create policy identity_insert_self on identity_documents
for insert with check (auth.uid() = user_id);

-- profile_images policies
drop policy if exists profile_images_select_self_or_admin on profile_images;
create policy profile_images_select_self_or_admin on profile_images
for select using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists profile_images_insert_self on profile_images;
create policy profile_images_insert_self on profile_images
for insert with check (auth.uid() = user_id);

drop policy if exists profile_images_update_self_or_admin on profile_images;
create policy profile_images_update_self_or_admin on profile_images
for update using (auth.uid() = user_id or is_admin(auth.uid())) with check (auth.uid() = user_id or is_admin(auth.uid()));

-- likes policies (男性 from_user を禁止)
drop policy if exists likes_select_self_or_admin on likes;
create policy likes_select_self_or_admin on likes
for select using (auth.uid() = from_user_id or auth.uid() = to_user_id or is_admin(auth.uid()));

drop policy if exists likes_insert_female_only on likes;
create policy likes_insert_female_only on likes
for insert with check (
  auth.uid() = from_user_id
  and exists(select 1 from users u where u.id = from_user_id and u.gender = 'female' and u.verification_status = 'approved' and u.is_suspended = false)
  and not exists(
    select 1 from matches m
    where (m.user_a_id = from_user_id or m.user_b_id = from_user_id)
      and m.relationship_status in ('relationship_mode', 'scheduled_delete')
  )
);

drop policy if exists favorites_select_owner on favorites;
create policy favorites_select_owner on favorites
for select using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists favorites_insert_owner on favorites;
create policy favorites_insert_owner on favorites
for insert with check (auth.uid() = user_id);

drop policy if exists favorites_delete_owner on favorites;
create policy favorites_delete_owner on favorites
for delete using (auth.uid() = user_id or is_admin(auth.uid()));

-- matches policies
drop policy if exists matches_select_member_or_admin on matches;
create policy matches_select_member_or_admin on matches
for select using (auth.uid() = user_a_id or auth.uid() = user_b_id or is_admin(auth.uid()));

drop policy if exists matches_insert_member_or_admin on matches;
create policy matches_insert_member_or_admin on matches
for insert with check (auth.uid() = user_a_id or auth.uid() = user_b_id or is_admin(auth.uid()));

drop policy if exists matches_update_member_or_admin on matches;
create policy matches_update_member_or_admin on matches
for update using (auth.uid() = user_a_id or auth.uid() = user_b_id or is_admin(auth.uid()))
with check (auth.uid() = user_a_id or auth.uid() = user_b_id or is_admin(auth.uid()));

-- messages policies
drop policy if exists messages_select_member_or_admin on messages;
create policy messages_select_member_or_admin on messages
for select using (
  is_admin(auth.uid()) or exists(
    select 1 from matches m where m.id = match_id and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
  )
);

drop policy if exists messages_insert_member on messages;
create policy messages_insert_member on messages
for insert with check (
  auth.uid() = sender_id and exists(
    select 1 from matches m where m.id = match_id and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid()) and m.relationship_status = 'active'
  )
);

-- reports policies
drop policy if exists reports_select_self_or_admin on reports;
create policy reports_select_self_or_admin on reports
for select using (auth.uid() = reporter_id or auth.uid() = target_user_id or is_admin(auth.uid()));

drop policy if exists reports_insert_self on reports;
create policy reports_insert_self on reports
for insert with check (auth.uid() = reporter_id);

drop policy if exists reports_update_admin on reports;
create policy reports_update_admin on reports
for update using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- blocks policies
drop policy if exists blocks_select_member_or_admin on blocks;
create policy blocks_select_member_or_admin on blocks
for select using (
  auth.uid() = blocker_user_id or auth.uid() = blocked_user_id or is_admin(auth.uid())
);

drop policy if exists blocks_insert_self on blocks;
create policy blocks_insert_self on blocks
for insert with check (auth.uid() = blocker_user_id);

drop policy if exists blocks_delete_self_or_admin on blocks;
create policy blocks_delete_self_or_admin on blocks
for delete using (auth.uid() = blocker_user_id or is_admin(auth.uid()));

-- admin_actions policies
drop policy if exists admin_actions_select_admin_only on admin_actions;
create policy admin_actions_select_admin_only on admin_actions
for select using (is_admin(auth.uid()));

drop policy if exists admin_actions_insert_admin_only on admin_actions;
create policy admin_actions_insert_admin_only on admin_actions
for insert with check (is_admin(auth.uid()));

drop policy if exists admin_audit_logs_select_admin_only on admin_audit_logs;
create policy admin_audit_logs_select_admin_only on admin_audit_logs
for select using (is_admin(auth.uid()));

drop policy if exists admin_audit_logs_insert_admin_only on admin_audit_logs;
create policy admin_audit_logs_insert_admin_only on admin_audit_logs
for insert with check (is_admin(auth.uid()));

drop policy if exists risk_checks_select_self_or_admin on risk_checks;
create policy risk_checks_select_self_or_admin on risk_checks
for select using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists risk_checks_insert_admin_only on risk_checks;
create policy risk_checks_insert_admin_only on risk_checks
for insert with check (is_admin(auth.uid()));

drop policy if exists risk_checks_update_admin_only on risk_checks;
create policy risk_checks_update_admin_only on risk_checks
for update using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- =========================
-- Storage buckets and policies
-- =========================
insert into storage.buckets (id, name, public)
values
  ('profile-images', 'profile-images', false),
  ('identity-documents', 'identity-documents', false),
  ('nurse-documents', 'nurse-documents', false)
on conflict (id) do nothing;

drop policy if exists profile_images_owner_or_admin on storage.objects;
create policy profile_images_owner_or_admin on storage.objects
for select to authenticated
using (
  bucket_id = 'profile-images'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or is_admin(auth.uid())
  )
);

drop policy if exists profile_images_insert_owner on storage.objects;
create policy profile_images_insert_owner on storage.objects
for insert to authenticated
with check (
  bucket_id = 'profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists identity_docs_owner_or_admin on storage.objects;
create policy identity_docs_owner_or_admin on storage.objects
for select to authenticated
using (
  bucket_id = 'identity-documents'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or is_admin(auth.uid())
  )
);

drop policy if exists identity_docs_insert_owner on storage.objects;
create policy identity_docs_insert_owner on storage.objects
for insert to authenticated
with check (
  bucket_id = 'identity-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists nurse_docs_owner_or_admin on storage.objects;
create policy nurse_docs_owner_or_admin on storage.objects
for select to authenticated
using (
  bucket_id = 'nurse-documents'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or is_admin(auth.uid())
  )
);

drop policy if exists nurse_docs_insert_owner on storage.objects;
create policy nurse_docs_insert_owner on storage.objects
for insert to authenticated
with check (
  bucket_id = 'nurse-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);
