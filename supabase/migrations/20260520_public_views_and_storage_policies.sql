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
