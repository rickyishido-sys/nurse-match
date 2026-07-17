# HANAKAI Ver1.0 — Release Audit (Final)

| 項目 | 値 |
|------|-----|
| 監査日 | 2026-07-18 |
| ブランチ | `hanakai-v10-safety` |
| 本番デプロイ | **未実施**（指示により禁止） |
| PR | [#1](https://github.com/rickyishido-sys/nurse-match/pull/1)（未マージ） |
| 最終判定 | **C — iOSビルド可能だが、TestFlight未完了** |

---

## 1. 監査項目サマリー（15項目）

| # | 項目 | 初期状態 | 修正内容 | 最終判定 | 証拠 |
|---|------|----------|----------|----------|------|
| 1 | 利用規約・PP同意 | 未実装 | `legal` オンボーディングステップ、`recordLegalConsentAction`、DB migration | **PASS（コード）** / **FAIL（DB未適用・Preview未検証）** | `src/lib/connection/legal-consent.ts`, migration `20260718_*` |
| 2 | アカウント削除 | 論理削除のみ | Auth ユーザー削除、関連データ purge、監査ログ | **PASS（コード）** / **FAIL（Preview未検証）** | `account-deletion.ts` |
| 3 | 開発用OTPバイパス | Production env に変数存在 | `isDevAuthBypassEnabled()` — Production 完全無効 | **PASS（コード）** / **FAIL（Production env 削除は人間操作）** | `legal-consent.ts`, `actions.ts` |
| 4 | DM | 1:1 未実装 | 再実装なし（グループ投稿のみ） | **Ver1.1 延期** | 既存 E2E 126/126 SNS |
| 5 | イベント編集・削除・キャンセル | 実装済み | 変更なし | **PASS** | Preview E2E |
| 6 | ブロック | 実装済み | 変更なし | **PASS** | Preview safety E2E 32/32 |
| 7 | パスワードリセット | 実装済み | 変更なし | **PASS** | コード確認 |
| 8 | 運営審査（承認・却下） | 実装済み | 変更なし | **PASS** | Preview E2E |
| 9 | 本人確認 | 実装済み | 変更なし | **PASS** | Preview E2E |
| 10 | SNS・交流 | 実装済み | 変更なし | **PASS** | SNS E2E 126/126 |
| 11 | 画像アップロード | 実装済み | 変更なし | **PASS** | file input + storage |
| 12 | iOS App Store 設定 | 不完全 | Info.plist 権限・URL scheme・暗号化申告 | **FAIL（gitignore・SDK未検証）** | `ios-config/Info.plist.additions.xml` |
| 13 | iOS UX | 未検証 | Simulator/実機未完了 | **FAIL** | xcodebuild: iOS 26.5 SDK 未インストール |
| 14 | プライバシー・権限 | NG | Info.plist 説明文追加 | **FAIL（Archive 未検証）** | 上記 |
| 15 | Guideline 4.2 | 高リスク | カメラ権限・ネイティブ体験説明。プッシュは Ver1.1 | **条件付き** | 審査メモ参照 |

---

## 2. 修正詳細

### 2.1 利用規約・プライバシーポリシー同意

- オンボーディングに `legal` ステップ追加（intro → legal → password → …）
- 未同意では `saveProfileAction` が `/register/profile?error=legal` へリダイレクト
- DB: `terms_agreed_at`, `privacy_agreed_at`, `terms_version`, `privacy_version`
- バージョン: 利用規約 `2026-07-16`、PP `2026-07-08`（各ページ改定日と同期）
- 設定・プロフィールから `/terms`, `/privacy` リンク（既存 `LegalLinks`）

### 2.2 アカウント削除

- `/account/delete` から削除開始（既存 UI）
- サーバー側 `deleteHanakaiAccount()`:
  - 関連データ purge（写真、SNS、Bloom、グループ、申込、ブロック等）
  - `hanakai_members` 匿名化 + `auth_user_id` NULL化
  - `auth.users` 削除（Admin API）
  - `hanakai_account_deletion_requests` 監査（FK cascade 解除 migration 含む）

#### データ保持方針

| データ | 処理 | 理由 |
|--------|------|------|
| プロフィール・写真・SNS | 削除 | 個人データ |
| グループ投稿・写真 | 削除 | 個人データ |
| Bloom 記録 | 削除 | 個人データ |
| イベント申込 | 削除 | 個人データ |
| 主催イベント | 削除（ユーザー作成分） | 個人関連 |
| 通報・問い合わせ | 削除 | 個人データ |
| 本人確認書類 | 削除 | 個人データ |
| `hanakai_members` 行 | 匿名化保持 | イベント履歴参照整合性 |
| 削除監査ログ | 保持 | 運営・法務 |
| 他ユーザーへのイベント影響 | 主催者 NULL / 退会表示 | 整合性 |

### 2.3 開発用認証バイパス

```typescript
// Production (VERCEL_ENV=production) では常に false
isDevAuthBypassEnabled()
```

Production の `REGISTER_DEV_BYPASS_OTP` 環境変数は **Vercel Dashboard で人間が削除** すること。

### 2.4 RLS — trust カラム自己更新防止

Migration `hanakai_guard_member_trust_columns` トリガーで `identity_verified` 等の自己更新を拒否。

---

## 3. 再実装しなかった機能（正常動作確認済み）

- イベント CRUD・キャンセル
- ブロック・通報
- パスワードリセット
- 運営 `/admin/hanakai/*` 承認フロー
- 本人確認 + 管理審査
- SNS リンク（126/126 E2E）

---

## 4. Ver1.1 延期

| 機能 | 理由 | 4.2 代替 |
|------|------|----------|
| 1:1 DM | グループ投稿で交流あり。工数大 | 審査メモでグループ交流を説明 |
| プッシュ通知 | APNs 設定・サーバー未整備 | イベント参加・プロフィール・カメラでネイティブ体験を強調 |
| 4桁チェックイン | 未実装 | イベント詳細画面で参加状態表示（既存） |

---

## 5. 検証証拠

| 検証 | 環境 | 結果 |
|------|------|------|
| `pnpm build` | ローカル | **PASS** |
| `tsc --noEmit` | ローカル | **PASS** |
| Preview Safety E2E | 2026-07-17（修正前コード） | 32/32 PASS |
| Preview SNS E2E | 2026-07-17（修正前コード） | 126/126 PASS |
| 規約同意 E2E | — | **未実施**（migration + deploy 後） |
| アカウント削除 E2E | — | **未実施** |
| iOS Simulator | Xcode | **FAIL** — iOS 26.5 SDK 未インストール |
| TestFlight | — | **未実施** |

---

## 6. ブロッカー一覧

| ブロッカー | 原因 | App Store 提出を妨げるか | 次の操作 |
|------------|------|--------------------------|----------|
| Supabase migration 未適用 | Preview/Staging DB へ未実行 | **はい** | `supabase db push` または SQL Editor |
| Preview 未デプロイ | ローカル修正のみ | **はい** | ブランチ push → Preview 確認 |
| Production `REGISTER_DEV_BYPASS_OTP` | Vercel env 残存 | **はい** | Dashboard で削除 |
| iOS SDK / Archive 未検証 | ローカル Xcode コンポーネント不足 | **はい** | Xcode > Settings > Components |
| TestFlight 未アップロード | Apple Developer 操作必要 | **はい** | Archive → Validate → Upload |
| `ios/` gitignore | Info.plist 変更がリポジトリ未追跡 | **はい** | `ios-config/Info.plist.additions.xml` をマージ |
| App Privacy / スクリーンショット | Connect 未入力 | **はい** | 人間が Connect 入力 |
| Guideline 4.2 | WebView ラッパー | **リスク** | 審査メモ + カメラ権限 |

---

## 7. App Store 提出可否

**提出不可（現時点）**

条件:
1. Migration 適用 + Preview E2E（同意・削除含む）PASS
2. iOS Archive / Validate 成功
3. TestFlight 内部テスト PASS
4. Production バイパス env 削除
5. App Store Connect メタデータ完了

---

## 8. 文言不一致報告

| 項目 | ユーザー指定 | リポジトリ内既存 |
|------|-------------|-----------------|
| App Store 表示名 | HANAKAI：体験から始まる、新しいつながり。 | `docs/store-submission/app-store-description-ja.md`: 「HANAKAI Connection」 |
| サブタイトル | 趣味や体験を通じて、新しい出会い。 | 同: 「体験でつながる、週替わりコミュニティ」 |
| iOS 表示名 | — | Info.plist: 「華会 HANAKAI」 |

**ユーザー指定文言を App Store Connect 提出時の正とする。** リポジトリ内ドキュメントは提出前に同期推奨。
