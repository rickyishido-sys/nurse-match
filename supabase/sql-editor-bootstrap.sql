-- Nurse Match: SQL Editor Bootstrap (schema + all migrations)
-- Generated automatically for manual execution in Supabase SQL Editor.
-- First-run robustness prioritized: every CREATE OR REPLACE VIEW is rewritten to DROP VIEW IF EXISTS + CREATE VIEW.

-- 0) Core schema baseline
-- Nurse Match beta MVP schema (Supabase production)
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  phone text unique,
  role text not null default 'user' check (role in ('user', 'female_admin', 'male_admin', 'super_admin')),
  gender text not null check (gender in ('female', 'male')),
  nickname text not null,
  birthdate date not null,
  age int not null check (age >= 18),
  location text not null,
  bio text not null default '',
  profile_image_url text not null default '',
  desired_gender text not null default 'both' check (desired_gender in ('male', 'female', 'both')),
  seeking_gender text not null default 'both' check (seeking_gender in ('male', 'female', 'both')),
  onboarding_status text not null default 'provisional' check (onboarding_status in ('provisional', 'profile_completed', 'verified')),
  risk_check_status text not null default 'not_checked' check (risk_check_status in ('not_checked', 'checking', 'clear', 'review_required', 'rejected')),
  verification_status text not null default 'pending' check (verification_status in ('pending', 'approved', 'rejected')),
  identity_document_url text,
  rejected_reason text,
  moderation_action text not null default 'none' check (moderation_action in ('none', 'warning', 'suspend', 'permanent_ban')),
  is_suspended boolean not null default false,
  is_test_user boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists female_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  nurse_document_url text not null,
  nurse_verification_status text not null default 'pending' check (nurse_verification_status in ('pending', 'approved', 'rejected')),
  workplace_type text not null check (workplace_type in ('hospital', 'clinic', 'beauty', 'nightshift', 'care_facility', 'home_visit', 'other')),
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

create table if not exists daily_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  target_user_id uuid not null references users(id) on delete cascade,
  recommendation_date date not null,
  rank int not null check (rank between 1 and 10),
  reason text not null default '',
  created_at timestamptz not null default now(),
  constraint daily_recommendations_unique_rank unique (user_id, recommendation_date, rank),
  constraint daily_recommendations_unique_target unique (user_id, recommendation_date, target_user_id)
);

create table if not exists interest_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  target_user_id uuid not null references users(id) on delete cascade,
  signal_type text not null check (signal_type in ('interested', 'skipped')),
  matched_preference boolean not null default false,
  reason text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint interest_signals_not_self check (user_id <> target_user_id)
);

create table if not exists credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  balance int not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('purchase', 'consume', 'adjust')),
  amount int not null,
  reason text not null default '',
  related_match_id uuid,
  created_at timestamptz not null default now()
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

drop view if exists public_user_cards cascade;
create view public_user_cards as
select
  u.id,
  u.gender,
  u.nickname,
  u.age,
  u.location,
  u.bio,
  u.profile_image_url,
  u.desired_gender,
  u.seeking_gender,
  u.verification_status,
  u.is_suspended
from users u;

drop view if exists female_profile_public cascade;
create view female_profile_public as
select
  fp.user_id,
  fp.nurse_verification_status,
  fp.workplace_type,
  fp.has_night_shift
from female_profiles fp;

drop view if exists male_profile_public cascade;
create view male_profile_public as
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
alter table daily_recommendations enable row level security;
alter table interest_signals enable row level security;
alter table credits enable row level security;
alter table credit_transactions enable row level security;
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

drop policy if exists daily_recommendations_select_owner_or_admin on daily_recommendations;
create policy daily_recommendations_select_owner_or_admin on daily_recommendations
for select using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists daily_recommendations_insert_owner_or_admin on daily_recommendations;
create policy daily_recommendations_insert_owner_or_admin on daily_recommendations
for insert with check (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists daily_recommendations_delete_owner_or_admin on daily_recommendations;
create policy daily_recommendations_delete_owner_or_admin on daily_recommendations
for delete using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists interest_signals_select_owner_or_admin on interest_signals;
create policy interest_signals_select_owner_or_admin on interest_signals
for select using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists interest_signals_insert_owner on interest_signals;
create policy interest_signals_insert_owner on interest_signals
for insert with check (auth.uid() = user_id);

drop policy if exists interest_signals_delete_owner_or_admin on interest_signals;
create policy interest_signals_delete_owner_or_admin on interest_signals
for delete using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists credits_select_owner_or_admin on credits;
create policy credits_select_owner_or_admin on credits
for select using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists credits_insert_owner_or_admin on credits;
create policy credits_insert_owner_or_admin on credits
for insert with check (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists credits_update_owner_or_admin on credits;
create policy credits_update_owner_or_admin on credits
for update using (auth.uid() = user_id or is_admin(auth.uid()))
with check (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists credit_transactions_select_owner_or_admin on credit_transactions;
create policy credit_transactions_select_owner_or_admin on credit_transactions
for select using (auth.uid() = user_id or is_admin(auth.uid()));

drop policy if exists credit_transactions_insert_owner_or_admin on credit_transactions;
create policy credit_transactions_insert_owner_or_admin on credit_transactions
for insert with check (auth.uid() = user_id or is_admin(auth.uid()));

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


-- Migration: 20260519_male_review_and_reports.sql
alter table if exists male_profiles
  add column if not exists male_review_status text not null default 'pending' check (male_review_status in ('pending', 'approved', 'rejected')),
  add column if not exists internal_memo text;

alter table if exists male_profiles
  drop constraint if exists male_profiles_marital_status_check,
  add constraint male_profiles_marital_status_check check (marital_status in ('single', 'married', 'divorced', 'partner'));

alter table if exists users
  add column if not exists moderation_action text not null default 'none' check (moderation_action in ('none', 'warning', 'suspend', 'permanent_ban')),
  add column if not exists rejected_reason text;

alter table if exists reports
  add column if not exists reason_type text not null default 'other' check (reason_type in ('fake_marital_status', 'harassment', 'dangerous', 'fake_profile', 'spam', 'other'));


-- Migration: 20260520_public_views_and_storage_policies.sql
drop view if exists female_profile_public cascade;
create view female_profile_public as
select
  fp.user_id,
  fp.nurse_verification_status,
  fp.workplace_type,
  fp.has_night_shift
from female_profiles fp;

drop view if exists male_profile_public cascade;
create view male_profile_public as
select
  mp.user_id,
  mp.job,
  mp.income,
  mp.marital_status,
  mp.male_review_status,
  mp.height,
  mp.body_type,
  mp.holiday,
  mp.smoking,
  mp.drinking
from male_profiles mp;

grant select on public_user_cards to authenticated;
grant select on female_profile_public to authenticated;
grant select on male_profile_public to authenticated;

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


-- Migration: 20260520_relationship_privacy.sql
alter table public.matches
  add column if not exists relationship_status text not null default 'active',
  add column if not exists relationship_started_at timestamptz,
  add column if not exists scheduled_delete_at timestamptz,
  add column if not exists hold_deletion boolean not null default false;

alter table public.matches
  drop constraint if exists matches_relationship_status_check;

alter table public.matches
  add constraint matches_relationship_status_check
  check (relationship_status in ('active', 'relationship_mode', 'scheduled_delete', 'deleted'));

drop policy if exists matches_update_member_or_admin on public.matches;
create policy matches_update_member_or_admin on public.matches
for update using (auth.uid() = user_a_id or auth.uid() = user_b_id or is_admin(auth.uid()))
with check (auth.uid() = user_a_id or auth.uid() = user_b_id or is_admin(auth.uid()));

drop policy if exists messages_insert_member on public.messages;
create policy messages_insert_member on public.messages
for insert with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.matches m
    where m.id = match_id
      and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
      and m.relationship_status = 'active'
  )
);

drop policy if exists likes_insert_female_only on public.likes;
create policy likes_insert_female_only on public.likes
for insert with check (
  auth.uid() = from_user_id
  and exists (
    select 1
    from public.users u
    where u.id = from_user_id
      and u.gender = 'female'
      and u.verification_status = 'approved'
      and u.is_suspended = false
  )
  and not exists (
    select 1
    from public.matches m
    where (m.user_a_id = from_user_id or m.user_b_id = from_user_id)
      and m.relationship_status in ('relationship_mode', 'scheduled_delete')
  )
);


-- Migration: 20260520_safety_ops.sql
alter table if exists reports
  drop constraint if exists reports_status_check,
  add constraint reports_status_check check (status in ('open', 'reviewing', 'resolved', 'dismissed'));

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

alter table blocks enable row level security;
alter table admin_actions enable row level security;

drop policy if exists blocks_select_member_or_admin on blocks;
create policy blocks_select_member_or_admin on blocks
for select using (auth.uid() = blocker_user_id or auth.uid() = blocked_user_id or is_admin(auth.uid()));

drop policy if exists blocks_insert_self on blocks;
create policy blocks_insert_self on blocks
for insert with check (auth.uid() = blocker_user_id);

drop policy if exists blocks_delete_self_or_admin on blocks;
create policy blocks_delete_self_or_admin on blocks
for delete using (auth.uid() = blocker_user_id or is_admin(auth.uid()));

drop policy if exists admin_actions_select_admin_only on admin_actions;
create policy admin_actions_select_admin_only on admin_actions
for select using (is_admin(auth.uid()));

drop policy if exists admin_actions_insert_admin_only on admin_actions;
create policy admin_actions_insert_admin_only on admin_actions
for insert with check (is_admin(auth.uid()));


-- Migration: 20260520_search_profile_fields.sql
alter table public.male_profiles
  add column if not exists has_children boolean not null default false,
  add column if not exists income_verified boolean not null default false,
  add column if not exists face_photo_verified boolean not null default false,
  add column if not exists night_shift_understanding boolean not null default false,
  add column if not exists shift_work_understanding boolean not null default false,
  add column if not exists late_night_contact_ok boolean not null default false,
  add column if not exists first_date_cost text,
  add column if not exists personality_tags text[] not null default '{}';

drop view if exists public.male_profile_public cascade;
create view public.male_profile_public as
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
from public.male_profiles mp;


-- Migration: 20260521_add_is_test_user.sql
alter table public.users
add column if not exists is_test_user boolean not null default false;


-- Migration: 20260521_add_seeking_gender.sql
alter table public.users
add column if not exists seeking_gender text;

update public.users
set seeking_gender = case
  when gender = 'male' then 'female'
  else coalesce(desired_gender, 'both')
end
where seeking_gender is null;

alter table public.users
alter column seeking_gender set default 'both';

alter table public.users
alter column seeking_gender set not null;

alter table public.users
drop constraint if exists users_seeking_gender_check;

alter table public.users
add constraint users_seeking_gender_check
check (seeking_gender in ('male', 'female', 'both'));

drop view if exists public_user_cards cascade;
create view public_user_cards as
select
  u.id,
  u.gender,
  u.nickname,
  u.age,
  u.location,
  u.bio,
  u.profile_image_url,
  u.desired_gender,
  u.seeking_gender,
  u.verification_status,
  u.is_suspended
from public.users u;


-- Migration: 20260521_add_user_phone_unique.sql
alter table public.users
add column if not exists phone text;

create unique index if not exists users_phone_unique_idx
on public.users (phone)
where phone is not null;


-- Migration: 20260521_credits.sql
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


-- Migration: 20260521_daily_recommendations.sql
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


-- Migration: 20260521_expand_female_workplace_type.sql
alter table public.female_profiles
drop constraint if exists female_profiles_workplace_type_check;

alter table public.female_profiles
add constraint female_profiles_workplace_type_check
check (workplace_type in ('hospital', 'clinic', 'beauty', 'nightshift', 'care_facility', 'home_visit', 'other'));


-- Migration: 20260521_interest_signals.sql
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


-- Migration: 20260521_onboarding_profile_images_admin_roles.sql
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


-- Migration: 20260521_preview_favorites_risk_check.sql
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


-- Migration: 20260521_sync_test_auth_users.sql
-- Sync test users between auth.users and public.users.
-- Target emails:
-- - test-female@nursematch.app
-- - test-male@nursematch.app
--
-- This script is designed to be safe:
-- - existence checks before any update
-- - transaction-scoped (migration execution)
-- - raises NOTICE logs for each step
-- - raises EXCEPTION when a required sync cannot be completed safely

do $$
declare
  v_email text;
  v_auth_id uuid;
  v_public_id uuid;
  v_existing_new_user_id uuid;
  v_old_user public.users%rowtype;
  v_temp_email text;
  v_count int;
begin
  foreach v_email in array array['test-female@nursematch.app', 'test-male@nursematch.app']
  loop
    raise notice '--- sync start: % ---', v_email;

    select id
      into v_auth_id
    from auth.users
    where lower(email) = lower(v_email)
    limit 1;

    if v_auth_id is null then
      raise notice 'skip: auth.users not found for %', v_email;
      continue;
    end if;

    select *
      into v_old_user
    from public.users
    where lower(email) = lower(v_email)
    limit 1;

    if v_old_user.id is null then
      raise notice 'skip: public.users not found for %', v_email;
      continue;
    end if;

    v_public_id := v_old_user.id;

    if v_public_id = v_auth_id then
      raise notice 'already synced: email=%, id=%', v_email, v_auth_id;
      continue;
    end if;

    select id
      into v_existing_new_user_id
    from public.users
    where id = v_auth_id
    limit 1;

    if v_existing_new_user_id is not null then
      raise exception 'sync aborted for %: target id % already exists in public.users', v_email, v_auth_id;
    end if;

    v_temp_email := v_old_user.email || '.sync-old-' || left(v_public_id::text, 8);

    update public.users
      set email = v_temp_email,
          phone = null,
          updated_at = now()
    where id = v_public_id;
    get diagnostics v_count = row_count;
    raise notice 'users temp detach updated rows: %', v_count;

    insert into public.users (
      id, email, phone, role, gender, nickname, birthdate, age, location, bio, profile_image_url,
      desired_gender, seeking_gender, onboarding_status, risk_check_status, verification_status,
      identity_document_url, rejected_reason, moderation_action, is_suspended, is_test_user,
      created_at, updated_at
    ) values (
      v_auth_id, v_old_user.email, v_old_user.phone, v_old_user.role, v_old_user.gender, v_old_user.nickname,
      v_old_user.birthdate, v_old_user.age, v_old_user.location, v_old_user.bio, v_old_user.profile_image_url,
      v_old_user.desired_gender, v_old_user.seeking_gender, v_old_user.onboarding_status, v_old_user.risk_check_status,
      v_old_user.verification_status, v_old_user.identity_document_url, v_old_user.rejected_reason,
      v_old_user.moderation_action, v_old_user.is_suspended, v_old_user.is_test_user,
      v_old_user.created_at, now()
    );
    raise notice 'users inserted: old_id=%, new_id=%', v_public_id, v_auth_id;

    if exists(select 1 from public.female_profiles where user_id = v_public_id) then
      update public.female_profiles set user_id = v_auth_id where user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'female_profiles updated: %', v_count;
    end if;

    if exists(select 1 from public.male_profiles where user_id = v_public_id) then
      update public.male_profiles set user_id = v_auth_id where user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'male_profiles updated: %', v_count;
    end if;

    if exists(select 1 from public.profile_images where user_id = v_public_id) then
      update public.profile_images set user_id = v_auth_id where user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'profile_images updated: %', v_count;
    end if;

    if exists(select 1 from public.favorites where user_id = v_public_id or target_user_id = v_public_id) then
      update public.favorites set user_id = v_auth_id where user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'favorites.user_id updated: %', v_count;
      update public.favorites set target_user_id = v_auth_id where target_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'favorites.target_user_id updated: %', v_count;
    end if;

    if exists(select 1 from public.interest_signals where user_id = v_public_id or target_user_id = v_public_id) then
      update public.interest_signals set user_id = v_auth_id where user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'interest_signals.user_id updated: %', v_count;
      update public.interest_signals set target_user_id = v_auth_id where target_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'interest_signals.target_user_id updated: %', v_count;
    end if;

    if exists(select 1 from public.daily_recommendations where user_id = v_public_id or target_user_id = v_public_id) then
      update public.daily_recommendations set user_id = v_auth_id where user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'daily_recommendations.user_id updated: %', v_count;
      update public.daily_recommendations set target_user_id = v_auth_id where target_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'daily_recommendations.target_user_id updated: %', v_count;
    end if;

    if exists(select 1 from public.credits where user_id = v_public_id) then
      update public.credits set user_id = v_auth_id where user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'credits updated: %', v_count;
    end if;

    if exists(select 1 from public.credit_transactions where user_id = v_public_id) then
      update public.credit_transactions set user_id = v_auth_id where user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'credit_transactions updated: %', v_count;
    end if;

    if exists(select 1 from public.messages where sender_id = v_public_id) then
      update public.messages set sender_id = v_auth_id where sender_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'messages.sender_id updated: %', v_count;
    end if;

    if exists(select 1 from public.matches where user_a_id = v_public_id or user_b_id = v_public_id) then
      update public.matches set user_a_id = v_auth_id where user_a_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'matches.user_a_id updated: %', v_count;
      update public.matches set user_b_id = v_auth_id where user_b_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'matches.user_b_id updated: %', v_count;
    end if;

    -- Additional FK references to avoid orphaned old id.
    if exists(select 1 from public.likes where from_user_id = v_public_id or to_user_id = v_public_id) then
      update public.likes set from_user_id = v_auth_id where from_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'likes.from_user_id updated: %', v_count;
      update public.likes set to_user_id = v_auth_id where to_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'likes.to_user_id updated: %', v_count;
    end if;

    if exists(select 1 from public.reports where reporter_id = v_public_id or target_user_id = v_public_id) then
      update public.reports set reporter_id = v_auth_id where reporter_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'reports.reporter_id updated: %', v_count;
      update public.reports set target_user_id = v_auth_id where target_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'reports.target_user_id updated: %', v_count;
    end if;

    if exists(select 1 from public.blocks where blocker_user_id = v_public_id or blocked_user_id = v_public_id) then
      update public.blocks set blocker_user_id = v_auth_id where blocker_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'blocks.blocker_user_id updated: %', v_count;
      update public.blocks set blocked_user_id = v_auth_id where blocked_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'blocks.blocked_user_id updated: %', v_count;
    end if;

    if exists(select 1 from public.admin_action_logs where admin_user_id = v_public_id or target_user_id = v_public_id) then
      update public.admin_action_logs set admin_user_id = v_auth_id where admin_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'admin_action_logs.admin_user_id updated: %', v_count;
      update public.admin_action_logs set target_user_id = v_auth_id where target_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'admin_action_logs.target_user_id updated: %', v_count;
    end if;

    if exists(select 1 from public.admin_audit_logs where admin_user_id = v_public_id or target_user_id = v_public_id) then
      update public.admin_audit_logs set admin_user_id = v_auth_id where admin_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'admin_audit_logs.admin_user_id updated: %', v_count;
      update public.admin_audit_logs set target_user_id = v_auth_id where target_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'admin_audit_logs.target_user_id updated: %', v_count;
    end if;

    if exists(select 1 from public.risk_checks where user_id = v_public_id or final_decider_id = v_public_id) then
      update public.risk_checks set user_id = v_auth_id where user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'risk_checks.user_id updated: %', v_count;
      update public.risk_checks set final_decider_id = v_auth_id where final_decider_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'risk_checks.final_decider_id updated: %', v_count;
    end if;

    delete from public.users where id = v_public_id;
    get diagnostics v_count = row_count;
    raise notice 'old users row deleted: %', v_count;

    raise notice 'sync done: email=%, old_id=%, new_id=%', v_email, v_public_id, v_auth_id;
  end loop;
end $$;


-- Migration: 20260523_add_message_reads_and_user_deleted_at.sql
alter table public.users
  add column if not exists deleted_at timestamptz;

create index if not exists idx_users_deleted_at on public.users(deleted_at);

create table if not exists public.message_reads (
  user_id uuid not null references public.users(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

create index if not exists idx_message_reads_match on public.message_reads(match_id, user_id);


-- Migration: 20260529_add_datefi_interests.sql
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



-- Migration: 20260530_add_swipes_table.sql
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



-- Verification: required tables existence
select table_name from information_schema.tables where table_schema = 'public' and table_name in ('users','female_profiles','male_profiles','identity_documents','likes','matches','messages','swipes','datefi_interests') order by table_name;

-- Verification: RLS enabled
select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename in ('users','female_profiles','male_profiles','identity_documents','likes','matches','messages','swipes','datefi_interests') order by tablename;

-- Verification: storage buckets
select id, name, public from storage.buckets where id in ('profile-images','identity-documents','nurse-documents') order by id;