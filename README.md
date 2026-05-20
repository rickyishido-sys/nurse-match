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
