-- Seed NOTE:
-- 1) Supabase Auth 側にユーザー作成済みであること（email/password）
-- 2) public.users は auth.users.id を使って upsert すること
-- public.users だけ作成してもログインできません。

-- 既存デモユーザー
insert into public.users (
  id, email, role, gender, nickname, birthdate, age, location, bio, profile_image_url, desired_gender, seeking_gender,
  onboarding_status, verification_status, identity_document_url, is_suspended, is_test_user
)
values
  ('00000000-0000-0000-0000-0000000000f1', 'hana@nursematch.app', 'user', 'female', 'はな', '1996-03-10', 30, '東京都', '都内で働く看護師です。', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800', 'both', 'both', 'verified', 'approved', 'private/identity/u_f_1.pdf', false, false),
  ('00000000-0000-0000-0000-0000000000f2', 'yui@nursematch.app', 'user', 'female', 'ゆい', '1998-05-23', 27, '神奈川県', '夜勤あり。映画好き。', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800', 'female', 'female', 'verified', 'approved', 'private/identity/u_f_2.pdf', false, false),
  ('00000000-0000-0000-0000-0000000000m1', 'taro@nursematch.app', 'user', 'male', 'タロウ', '1992-11-05', 33, '東京都', 'IT企業勤務。', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800', 'female', 'female', 'verified', 'approved', 'private/identity/u_m_1.pdf', false, false),
  ('00000000-0000-0000-0000-0000000000a1', 'admin@nursematch.app', 'super_admin', 'female', '運営', '1990-01-01', 36, '東京都', '運営アカウント', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800', 'both', 'both', 'verified', 'approved', 'private/identity/admin.pdf', false, false),
  ('00000000-0000-0000-0000-0000000000a2', 'female-admin@nursematch.app', 'female_admin', 'female', '女性管理', '1991-01-01', 35, '東京都', '女性管理者', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800', 'both', 'both', 'verified', 'approved', 'private/identity/admin-f.pdf', false, false),
  ('00000000-0000-0000-0000-0000000000a3', 'male-admin@nursematch.app', 'male_admin', 'male', '男性管理', '1991-01-01', 35, '東京都', '男性管理者', 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=800', 'both', 'female', 'verified', 'approved', 'private/identity/admin-m.pdf', false, false)
on conflict (id) do update
set
  email = excluded.email,
  role = excluded.role,
  gender = excluded.gender,
  nickname = excluded.nickname,
  birthdate = excluded.birthdate,
  age = excluded.age,
  location = excluded.location,
  bio = excluded.bio,
  profile_image_url = excluded.profile_image_url,
  desired_gender = excluded.desired_gender,
  seeking_gender = excluded.seeking_gender,
  onboarding_status = excluded.onboarding_status,
  verification_status = excluded.verification_status,
  identity_document_url = excluded.identity_document_url,
  is_suspended = excluded.is_suspended,
  is_test_user = excluded.is_test_user;

-- テスト人格アカウント（Authユーザー作成後に利用）
-- test-female@nursematch.app
-- test-male@nursematch.app
--
-- 例:
-- select id, email from auth.users where email in ('test-female@nursematch.app', 'test-male@nursematch.app');
-- 下記SQLの UUID を auth.users.id に置き換えて実行してください。

insert into public.users (
  id, email, role, gender, nickname, birthdate, age, location, bio, profile_image_url, desired_gender, seeking_gender,
  onboarding_status, verification_status, identity_document_url, is_suspended, is_test_user
)
values
  ('11111111-1111-1111-1111-1111111111f1', 'test-female@nursematch.app', 'user', 'female', 'さくら', '1997-05-20', 29, '東京都', 'テスト用女性人格アカウント', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800', 'male', 'male', 'verified', 'approved', null, false, true),
  ('11111111-1111-1111-1111-1111111111m1', 'test-male@nursematch.app', 'user', 'male', '蓮', '1992-04-03', 34, '東京都', 'テスト用男性人格アカウント', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800', 'female', 'female', 'verified', 'approved', null, false, true)
on conflict (id) do update
set
  nickname = excluded.nickname,
  age = excluded.age,
  location = excluded.location,
  onboarding_status = excluded.onboarding_status,
  verification_status = excluded.verification_status,
  is_test_user = excluded.is_test_user;

insert into public.female_profiles (user_id, nurse_document_url, nurse_verification_status, workplace_type, has_night_shift)
values
  ('11111111-1111-1111-1111-1111111111f1', '', 'approved', 'hospital', true)
on conflict (user_id) do update
set
  nurse_document_url = excluded.nurse_document_url,
  nurse_verification_status = excluded.nurse_verification_status,
  workplace_type = excluded.workplace_type,
  has_night_shift = excluded.has_night_shift;

insert into public.male_profiles (
  user_id, job, income, marital_status, has_children, male_review_status, income_verified, face_photo_verified,
  internal_memo, height, body_type, holiday, smoking, drinking, night_shift_understanding, shift_work_understanding,
  late_night_contact_ok, first_date_cost, personality_tags
)
values
  ('11111111-1111-1111-1111-1111111111m1', 'IT企業経営', '1000万円〜1500万円', 'single', false, 'approved', true, true, null, 178, '普通', '土日', 'なし', 'たまに', true, true, true, '男性が負担', array['誠実', '落ち着き'])
on conflict (user_id) do update
set
  job = excluded.job,
  income = excluded.income,
  marital_status = excluded.marital_status,
  male_review_status = excluded.male_review_status,
  income_verified = excluded.income_verified,
  face_photo_verified = excluded.face_photo_verified,
  height = excluded.height,
  smoking = excluded.smoking,
  drinking = excluded.drinking,
  night_shift_understanding = excluded.night_shift_understanding,
  shift_work_understanding = excluded.shift_work_understanding;
