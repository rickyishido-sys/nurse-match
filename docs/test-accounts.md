# 本番 Supabase テスト人格アカウント作成手順

このドキュメントは、本番 Supabase 環境でテスト人格アカウントを作成し、機能確認するための手順です。

- 女性テスト: `test-female@nursematch.app`
- 男性テスト: `test-male@nursematch.app`

## 1. Supabase Auth でユーザー作成

1. Supabase Dashboard を開く
2. `Authentication` → `Users` → `Add user`
3. 以下2ユーザーを作成
   - `test-female@nursematch.app`
   - `test-male@nursematch.app`
4. パスワードは検証チームで共有可能なものを設定

補足:
- ここで作成される UUID が `auth.users.id` です。
- `public.users` だけ作ってもログインできません（Auth が必須）。

## 2. auth.users.id の確認方法

SQL Editor で以下を実行して UUID を確認します。

```sql
select id, email, created_at
from auth.users
where email in ('test-female@nursematch.app', 'test-male@nursematch.app')
order by email;
```

以降の SQL では、取得した UUID を使います。

## 3. public.users / female_profiles / male_profiles への紐づけ SQL

`<FEMALE_AUTH_UUID>` と `<MALE_AUTH_UUID>` を実 UUID に置換して実行してください。

```sql
-- users
insert into public.users (
  id, email, role, gender, nickname, birthdate, age, location, bio, profile_image_url,
  desired_gender, onboarding_status, verification_status, risk_check_status,
  identity_document_url, rejected_reason, moderation_action, is_suspended, is_test_user
)
values
  (
    '<FEMALE_AUTH_UUID>', 'test-female@nursematch.app', 'user', 'female', 'さくら',
    '1997-05-20', 29, '東京都', 'テスト用女性人格アカウント',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
    'male', 'verified', 'approved', 'clear', null, null, 'none', false, true
  ),
  (
    '<MALE_AUTH_UUID>', 'test-male@nursematch.app', 'user', 'male', '蓮',
    '1992-04-03', 34, '東京都', 'テスト用男性人格アカウント',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
    'female', 'verified', 'approved', 'clear', null, null, 'none', false, true
  )
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
  onboarding_status = excluded.onboarding_status,
  verification_status = excluded.verification_status,
  risk_check_status = excluded.risk_check_status,
  is_suspended = excluded.is_suspended,
  is_test_user = excluded.is_test_user;

-- female profile
insert into public.female_profiles (
  user_id, nurse_document_url, nurse_verification_status, workplace_type, has_night_shift
)
values
  ('<FEMALE_AUTH_UUID>', '', 'approved', 'hospital', true)
on conflict (user_id) do update
set
  nurse_document_url = excluded.nurse_document_url,
  nurse_verification_status = excluded.nurse_verification_status,
  workplace_type = excluded.workplace_type,
  has_night_shift = excluded.has_night_shift;

-- male profile
insert into public.male_profiles (
  user_id, job, income, marital_status, has_children, male_review_status,
  income_verified, face_photo_verified, internal_memo, height, body_type, holiday,
  smoking, drinking, night_shift_understanding, shift_work_understanding,
  late_night_contact_ok, first_date_cost, personality_tags
)
values
  (
    '<MALE_AUTH_UUID>', 'IT企業経営', '1000万円〜1500万円', 'single', false, 'approved',
    true, true, null, 178, '普通', '土日', 'なし', 'たまに', true, true, true,
    '男性が負担', array['誠実', '落ち着き']
  )
on conflict (user_id) do update
set
  job = excluded.job,
  income = excluded.income,
  marital_status = excluded.marital_status,
  has_children = excluded.has_children,
  male_review_status = excluded.male_review_status,
  income_verified = excluded.income_verified,
  face_photo_verified = excluded.face_photo_verified,
  internal_memo = excluded.internal_memo,
  height = excluded.height,
  body_type = excluded.body_type,
  holiday = excluded.holiday,
  smoking = excluded.smoking,
  drinking = excluded.drinking,
  night_shift_understanding = excluded.night_shift_understanding,
  shift_work_understanding = excluded.shift_work_understanding,
  late_night_contact_ok = excluded.late_night_contact_ok,
  first_date_cost = excluded.first_date_cost,
  personality_tags = excluded.personality_tags;
```

## 4. ログイン確認手順

1. `test-female@nursematch.app` でログイン
2. 女性ホーム ` /home/female ` に遷移できることを確認
3. ログアウト
4. `test-male@nursematch.app` でログイン
5. 男性ホーム ` /home/male ` に遷移できることを確認

## 5. 表示確認

### 女性側で男性が見えるか

1. 女性テストで ` /home/female ` を開く
2. 本日のおすすめ/候補に男性テスト（蓮）が表示されることを確認

### 男性側で女性が見えるか

1. 男性テストで ` /home/male ` を開く
2. 本日の紹介候補に女性テスト（さくら）が表示されることを確認

## 6. 機能確認シナリオ

以下を順に確認します。

1. 男性側: 女性を `お気に入り`
2. 男性側: 女性へ `興味あり`
3. 女性側: 男性へ `Like`
4. `Match` が成立すること
5. ` /chat/[matchId] ` で双方メッセージ送受信できること

補足:
- 男性の `興味あり` は女性へ直接通知されません（推薦シグナルのみ）。
- テストアカウント以外の審査ルールは通常どおり維持されます。
