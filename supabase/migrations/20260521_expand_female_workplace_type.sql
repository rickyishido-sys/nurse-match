alter table public.female_profiles
drop constraint if exists female_profiles_workplace_type_check;

alter table public.female_profiles
add constraint female_profiles_workplace_type_check
check (workplace_type in ('hospital', 'clinic', 'beauty', 'nightshift', 'care_facility', 'home_visit', 'other'));
