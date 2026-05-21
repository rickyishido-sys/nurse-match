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
  u.seeking_gender,
  u.verification_status,
  u.is_suspended
from public.users u;
