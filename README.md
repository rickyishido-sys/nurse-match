# Nurse Match beta MVP

## チャット整理（この実装の進め方）
- チャット1: 要件定義・画面/機能確定
- チャット2: DB設計とRLS方針
- チャット3: UI/画面実装
- チャット4: 管理画面と審査運用
- チャット5: 本番接続・テスト・改善

## 追加実装（今回）
- Supabase Auth 本接続（email/password）
- login/logout/register 連携
- `NEXT_PUBLIC_USE_MOCK=false` のときだけ Supabase 実データ利用
- 男性審査制 `male_review_status` と `internal_memo`
- 婚姻状態 `single/married/divorced/partner`
- 女性側婚姻フィルター（独身のみ/既婚含む/パートナー含む）
- reports 拡張 `reason_type`
- users 拡張 `moderation_action`, `rejected_reason`
- `/login`, `/rejected`, `/suspended` 画面追加
- middleware による未ログイン制御

## 主要パス
- `src/app/login/page.tsx`
- `src/app/rejected/page.tsx`
- `src/app/suspended/page.tsx`
- `src/lib/actions.ts`
- `src/lib/data.ts`
- `supabase/schema.sql`

## Storage バケット
- `profile-images`
- `identity-documents`
- `nurse-documents`

※ 書類 URL は本人または管理者のみRLSで参照可能。一般ユーザーには返さない設計。

## ローカル起動
```bash
npm install
cp .env.example .env.local
npm run dev
```

## モード
- `NEXT_PUBLIC_USE_MOCK=true`: ダミーデータ
- `NEXT_PUBLIC_USE_MOCK=false`: Supabase本接続

## 検証
```bash
npm run lint
npm run build
```

## デプロイ（Vercel Git連携）
GitHub Actionsは使わず、Vercel標準のGit連携で本番反映します。

```bash
git add .
git commit -m "update"
git push origin main
```

`main` への push をトリガーに、Vercel側で自動デプロイされ、`nurse.kranz.design` に反映されます。

## 管理者ログイン（本番）
- 本番の管理者ログインURLは `https://nurse.kranz.design/admin/login` です（パスは `/admin/login`）。
- `src/middleware.ts` の `PUBLIC_PATHS` に `/admin/login` が含まれているため、本番でも未ログイン状態でアクセス可能です。
- 一般ユーザーは `/login`、管理者は `/admin/login` を利用します（導線を完全分離）。
- `/admin/*` は `public.users.role` が `female_admin` / `male_admin` / `super_admin` の場合のみアクセス可能です。
- ログイン後のリダイレクト先:
  - `super_admin` → `/admin`
  - `female_admin` → `/admin/female`
  - `male_admin` → `/admin/male`

## 初期 super_admin 作成手順（Supabase）
1. Supabase Dashboard の **Authentication > Users** で管理者用ユーザーを作成（Email/Password）。
2. 作成したユーザーの `id`（UUID）を確認。
3. SQL Editor で以下を実行して `public.users.role` を `super_admin` に更新。

```sql
-- 例: 既に public.users に対象ユーザー行がある前提
update public.users
set role = 'super_admin'
where id = (
  select id
  from auth.users
  where email = 'admin@example.com'
);
```

補足:
- 対象ユーザーが `public.users` に未作成の場合は、先に該当ユーザー行を作成してから `role` を更新してください。
- `female_admin` / `male_admin` を作る場合は同様に `role` をそれぞれ変更します。

## テスト人格アカウント（男性/女性）
- 目的: 本番機能のE2E確認（お気に入り / 興味あり / Like / Match / Chat）
- 対象:
  - 女性: `test-female@nursematch.app`
  - 男性: `test-male@nursematch.app`
- パスワード（共通）: `test1234`
- 両者とも `is_test_user=true` で管理画面に `TEST` バッジ表示されます。

### 重要
- Supabase Auth 側のユーザー作成が先に必要です。
- `public.users` だけ追加してもログインできません。
- Auth と `public.users` の同期が必要です（`auth.users.id` と `public.users.id` を一致させる）。

### Supabase 手順
1. Authentication > Users で上記2メールのユーザーを作成。
   - Email: `test-female@nursematch.app` / Password: `test1234`
   - Email: `test-male@nursematch.app` / Password: `test1234`
   - Email confirmed を有効にして作成すること（ログイン検証を簡略化）
2. `auth.users.id` を確認。
3. `supabase/seed.sql` のテストユーザーUUIDを `auth.users.id` に置換して実行。
4. `public.users`, `public.female_profiles`, `public.male_profiles` が upsert されます。

### mock 手順
- `NEXT_PUBLIC_USE_MOCK=true` の場合、同名メールのユーザーが `src/lib/mock-data.ts` に含まれているため、そのままログイン検証できます。

## 認証メール文言（Supabase）
- 認証メール本文のボタン文言（例: `Sign in`）は Supabase 側テンプレートで変更できます。
- 変更箇所: **Supabase Dashboard > Authentication > Emails > Magic Link or OTP**
- 現在はアプリ側で `/auth/callback?next=/register/details` を利用して登録導線を制御しています。
