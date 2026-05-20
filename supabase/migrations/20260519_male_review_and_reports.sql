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
