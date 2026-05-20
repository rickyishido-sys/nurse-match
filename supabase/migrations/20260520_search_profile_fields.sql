alter table public.male_profiles
  add column if not exists has_children boolean not null default false,
  add column if not exists income_verified boolean not null default false,
  add column if not exists face_photo_verified boolean not null default false,
  add column if not exists night_shift_understanding boolean not null default false,
  add column if not exists shift_work_understanding boolean not null default false,
  add column if not exists late_night_contact_ok boolean not null default false,
  add column if not exists first_date_cost text,
  add column if not exists personality_tags text[] not null default '{}';

create or replace view public.male_profile_public as
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
