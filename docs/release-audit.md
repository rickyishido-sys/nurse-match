# HANAKAI Connection Ver1.0 リリース監査レポート

| 項目 | 内容 |
|------|------|
| 監査日 | 2026年7月14日 |
| 対象 | HANAKAI Connection Ver1.0（Web / PWA） |
| 本番URL | https://hanakai.kranz.design/ |
| ブランチ | `main`（最新デプロイ: アルファベット装飾無効化 `7e8b8b4` 以降） |
| 監査方式 | コードベース静的解析 + ルート・マイグレーション・Server Actions 棚卸し |

---

## 総合判定

**Ver1.0 Web リリース: 条件付き可（要修正あり）**

コア導線（ランディング → 登録 → イベント閲覧・申込 → グループフィード → 管理画面）は Supabase 連携で実装済み。一方、ストア審査・安全要件・UX の観点で **ブロック機能未実装、DM スタブ、パスワードリセット UI 欠如、レガシールート残存** などが残っており、App Store / Google Play へのネイティブ申請前には追加対応が必須。

---

## 1. ページ一覧

全 **87** ルート（`src/app/**/page.tsx`）。以下は機能別分類。

### 1.1 HANAKAI Connection（本番コア）

| パス | 説明 | 状態 |
|------|------|------|
| `/` | ランディング（v2 エディトリアル） | ✅ 実装 |
| `/login` | ログイン | ✅ |
| `/register` | 新規登録（メール OTP） | ✅ |
| `/register/profile` | 初回プロフィール | ✅ |
| `/register/profile/personality` | 性格診断 | ✅ |
| `/register/details` | 登録詳細 | ✅ |
| `/register/complete` | 登録完了 | ✅ |
| `/auth/callback` | 認証コールバック（クライアント） | ✅ |
| `/onboarding` | オンボーディング | ✅ |
| `/home` | ホーム（ログイン後） | ✅ |
| `/events` | イベント一覧 | ✅ |
| `/events/[id]` | イベント詳細 | ✅ |
| `/events/create` | イベント作成 | ✅ 要ログイン |
| `/events/manage/[id]` | ホスト管理 | ✅ 要ログイン |
| `/events/participation/confirm` | 参加確認（メールトークン） | ✅ |
| `/connections` | Connection 一覧 | ✅ |
| `/connections/[eventId]` | Connection 詳細（メンバー・DM UI） | ⚠️ DM はスタブ |
| `/groups/[eventId]` | グループフィード（投稿・写真） | ✅ |
| `/profile/[memberId]` | 他者プロフィール閲覧 | ✅ |
| `/my-profile` | 自分のプロフィール閲覧・編集 | ✅ |
| `/manage` | ホスト向け参加者選定 | ✅ |
| `/account/delete` | アカウント削除 | ✅ |
| `/contact` | お問い合わせ | ✅ |
| `/terms` | 利用規約 | ✅ |
| `/privacy` | プライバシーポリシー | ✅ |
| `/community-guidelines` | コミュニティガイドライン | ✅ レガシーシェル |

### 1.2 管理画面（本番）

| パス | 説明 | 状態 |
|------|------|------|
| `/admin/login` | 管理ログイン | ✅ |
| `/admin/hanakai` | ダッシュボード | ✅ |
| `/admin/hanakai/applications` | 参加申請管理 | ✅ |
| `/admin/hanakai/events` | イベント管理 | ✅ |
| `/admin/hanakai/members` | 会員一覧 | ✅ |
| `/admin/hanakai/members/[memberId]` | 会員詳細 | ✅ |
| `/admin/hanakai/reports` | 通報 inbox | ✅ |
| `/admin/hanakai/inquiries` | お問い合わせ inbox | ✅ |

### 1.3 管理画面（モック・レガシー）

| パス | 説明 | 状態 |
|------|------|------|
| `/admin` | 旧管理トップ | ⚠️ レガシー |
| `/admin/connection` | Connection 管理モック | ❌ モック・公開アクセス |
| `/admin/connection/*` | イベント・ユーザー・ホスト等モック | ❌ モック |
| `/admin/male`, `/admin/female` | 旧マッチング管理 | ❌ レガシー |
| `/admin/reviews`, `/admin/datefi-interests` 等 | 旧審査系 | ❌ レガシー |
| `/admin/system-check` | システムチェック | ⚠️ |

### 1.4 モック MVP / レガシー（Nurse Match 系）

| パス | 説明 | 状態 |
|------|------|------|
| `/posts`, `/posts/[id]`, `/posts/new` | 投稿（`lib/hanakai/data.ts` モック） | ❌ 未完成 |
| `/lives`, `/lives/[id]` | ライブ配信モック | ❌ 準備中 |
| `/members`, `/members/[id]` | メンバー一覧モック | ❌ モック |
| `/support`, `/support/[id]` | サポートモック | ❌ モック |
| `/instructor`, `/concept` | コンセプト・講師モック | ❌ モック |
| `/discover`, `/matches`, `/likes`, `/chats/*` | 旧マッチング | ❌ レガシー |
| `/home/male`, `/home/female` | 旧男女ホーム | ❌ レガシー |
| `/blocked-users` | ブロック一覧（レガシー） | ⚠️ Connection 未連携 |
| `/delete-account` | 旧削除パス | ⚠️ `/account/delete` と重複 |
| `/profile/edit` | 旧プロフィール編集 | ⚠️ `/my-profile` と重複 |
| `/settings` | 設定（通知は準備中） | ⚠️ |
| `/favorites`, `/activity`, `/cards`, `/datefi` 等 | 旧機能 | ❌ レガシー |

### 1.5 デバッグ・プレビュー

| パス | 説明 |
|------|------|
| `/preview`, `/onboarding-preview`, `/onboarding-test` | プレビュー・テスト |
| `/debug`, `/debug/env` | デバッグ |
| `/pending-review`, `/rejected`, `/suspended` 等 | 審査・停止状態画面 |

---

## 2. 認証

| 機能 | 実装 | 備考 |
|------|------|------|
| ログイン | ✅ | `/login` — メール + パスワード（`loginAction`） |
| 新規登録 | ✅ | `/register` — メール OTP → プロフィール作成 |
| ログアウト | ✅ | `HeaderUserMenu` / `logoutAction`（Supabase `signOut`） |
| パスワードリセット | ❌ | **UI なし**。`/api/auth/callback` は `recovery` OTP タイプ対応のみ |
| メール認証 | ✅ | 登録時 OTP メール → `/api/auth/callback` でセッション確立 |

**判定:** パスワードリセット導線が未実装。ログイン画面に「パスワードを忘れた」リンクがない。

---

## 3. プロフィール

| 機能 | 実装 | 備考 |
|------|------|------|
| 閲覧 | ✅ | `/profile/[memberId]`, `/my-profile` |
| 編集 | ✅ | `/my-profile?mode=edit` — `updateMyProfileAction` |
| 画像変更 | ✅ | `saveMemberPhotosAction` / Storage アップロード |
| タグ（興味タグ） | ✅ 登録時 / ⚠️ 編集時 | 編集フォームで `interestTags` 更新可 |
| 価値観（valueTags / purposes） | ⚠️ | **登録時のみ** `saveProfileAction` で保存。`updateMyProfileAction` は読み取るが **DB に保存しない** |
| 自己紹介（bio） | ✅ | 編集可。AI 下書き API は 503（準備中） |

**判定:** 価値観・参加目的の事後編集が欠落。Bloom AI 機能はスタブ。

---

## 4. イベント

| 機能 | 実装 | 備考 |
|------|------|------|
| 一覧 | ✅ | `/events` — カテゴリ・エリアフィルタ |
| 検索 | ✅ | クエリパラメータによる絞り込み |
| カテゴリ | ✅ | 散歩・カフェ・バー・フィットネス・花等 |
| 詳細 | ✅ | `/events/[id]` |
| 参加（申込） | ✅ | `applyConnectionEventAction` |
| キャンセル | ⚠️ | DB 上 `cancelled` ステータスあり。**アプリ内キャンセル UI なし**。メールトークン経由の辞退のみ（`declineParticipationAction`） |
| 作成 | ✅ | `/events/create` + `/api/hanakai/events/create` |
| 編集 | ❌ | 編集ルート・Action なし |
| 削除 | ❌ | 削除 Action なし |

**判定:** ホスト向けイベント編集・削除、参加者向けアプリ内キャンセルが未実装。

---

## 5. 管理画面

### 5.1 `/admin/hanakai/*`（本番・Supabase 連携）

| 機能 | 状態 |
|------|------|
| ダッシュボード KPI | ✅ |
| 参加申請 承認 / 却下 | ✅ |
| イベント募集タイプ変更 | ✅ |
| 会員一覧・詳細閲覧 | ✅ |
| 通報 inbox（ステータス更新・メモ） | ✅ |
| お問い合わせ inbox（解決マーク） | ✅ |
| PC ワイドレイアウト | ✅（`AdminShell` wide） |

### 5.2 `/admin/connection/*`（モック）

モックデータ（`admin-data.ts`）表示のみ。middleware 上 **公開パス**（`HANAKAI_PUBLIC_PREFIXES`）に含まれる。**本番では無効化または認証必須化が必要。**

### 5.3 `/manage`（ホスト向け）

イベント単位の参加者選定・承認・却下・信頼確認更新。Connection 管理者・ホスト向け。

---

## 6. 投稿機能

| 領域 | 状態 |
|------|------|
| グループ投稿 | ✅ `hanakai_group_posts` — `/groups/[eventId]` でテキスト投稿 |
| グループ写真 | ✅ アップロード・利用許可リクエスト・非表示 |
| `/posts` ルート | ❌ モック MVP（Supabase 未連携） |

**判定:** イベント後のグループフィード投稿は実装済み。汎用タイムライン `/posts` は未完成。

---

## 7. コメント

| 領域 | 状態 |
|------|------|
| グループ投稿へのコメント | ❌ 未実装（投稿はフラット、スレッドなし） |
| イベント詳細コメント | ❌ なし |

**判定:** コメント機能は Ver1.0 スコープ外。投稿への返信 UI・テーブルなし。

---

## 8. 通知

| 種別 | 状態 |
|------|------|
| アプリ内通知一覧 | ❌ `/notifications` なし |
| プッシュ通知 | ❌ Service Worker なし |
| メール通知 | ⚠️ | `hanakai_notification_schedules` テーブルあり。`participation-decision` / `weekly-digest` ロジックはコード存在、**実送信は限定的（ログ中心）** |
| 設定画面 | ⚠️ | `/settings` に「通知設定（準備中）」disabled ボタンのみ |

---

## 9. メッセージ

| 種別 | 状態 |
|------|------|
| Connection DM | ❌ **スタブ** — `sendMessageAction` は `console.log` のみ。DB 保存なし |
| レガシー DM | ⚠️ | `/chats`, `/messages` — 旧 `matches` / `messages` テーブル（Nurse Match） |

**判定:** `/connections/[eventId]` にメッセージ UI があるが実際には送信されない。**審査・UX 上の重大リスク。**

---

## 10. 利用規約

| 項目 | 状態 |
|------|------|
| `/terms` | ✅ Connection シェル、セクション構成済み |
| 登録フローからのリンク | ✅ `LegalLinks` コンポーネント |

---

## 11. プライバシーポリシー

| 項目 | 状態 |
|------|------|
| `/privacy` | ✅ データ収集・削除・通報対応を記載 |
| アカウント削除への言及 | ✅ |

---

## 12. お問い合わせ

| 項目 | 状態 |
|------|------|
| `/contact` | ✅ `ContactForm` → `hanakai_contact_inquiries` |
| 管理画面 inbox | ✅ `/admin/hanakai/inquiries` |

---

## 13. アカウント削除

| 項目 | 状態 |
|------|------|
| `/account/delete` | ✅ `deleteHanakaiAccountAction` — 論理削除 + `hanakai_account_deletion_requests` |
| 重複パス | ⚠️ `/delete-account`（レガシー）も存在 |
| middleware | ✅ `/account/delete` は認証必須 |
| 利用規約・PP 記載 | ✅ |

---

## 14. 通報

| 項目 | 状態 |
|------|------|
| ユーザー通報 UI | ✅ `ReportButton`（イベント・メンバー） |
| グループ投稿・写真通報 | ✅ `reportGroupPostAction` / `reportGroupPhotoAction` |
| DB | ✅ `hanakai_reports` |
| 管理対応 | ✅ `/admin/hanakai/reports` |
| レガシー通報 | ⚠️ `UserSafetyMenu`（旧マッチング用、`lib/actions.ts`） |

---

## 15. ブロック

| 項目 | 状態 |
|------|------|
| Connection ブロック | ❌ **未実装** |
| レガシー | ⚠️ `blocks` テーブル + `/blocked-users` + `UserSafetyMenu`（旧 UI のみ） |
| ランディング FAQ | 「通報機能」は記載、「ブロック」は未記載 |

**判定:** ソーシャルアプリ審査でブロックは事実上必須。Connection 導線に未統合。

---

## 16. SEO

| 項目 | 状態 |
|------|------|
| ルート `metadata` | ✅ `layout.tsx` — title, description, OG, Twitter |
| `robots.ts` | ✅ `/admin`, `/api`, `/debug` disallow |
| `sitemap.ts` | ⚠️ **ホームページのみ**（`/events` 等未掲載） |
| ページ個別 metadata | ⚠️ 一部のみ（terms, privacy, account/delete 等） |
| canonical | ⚠️ ルートのみ `/` |

---

## 17. PWA

| 項目 | 状態 |
|------|------|
| `manifest.ts` | ✅ name, icons, standalone, theme_color |
| アイコン | ✅ `/icon.png`, `/apple-touch-icon.png`, maskable SVG |
| Service Worker | ❌ なし（オフライン・プッシュ非対応） |
| `display: standalone` | ✅ |

**判定:** 「ホーム画面に追加」は可能。フル PWA（オフライン・プッシュ）は未対応。

---

## 18. レスポンシブ

`CONNECTION_MAX_WIDTH_CLASS = max-w-[390px] md:max-w-[768px] lg:max-w-[1200px]`

| デバイス | 状態 | 備考 |
|----------|------|------|
| Mobile（〜390px） | ✅ | ボトムナビ、safe-area 対応 |
| Tablet（768px） | ✅ | コンテナ拡張 |
| PC（1200px） | ✅ | 管理画面は `AdminShell wide` で全幅。Connection シェルは中央 1200px + ボーダー |

ヘッダー CTA は `sm:` ブレークポイントで文言切替。ランディング v2 は `lg:` グリッド。

---

## 19. エラー画面

| 種別 | ファイル | 状態 |
|------|----------|------|
| 404 グローバル | `src/app/not-found.tsx` | ✅ ブランド適用 |
| 404 イベント | `events/[id]/not-found.tsx` | ✅ |
| 404 Connection | `connections/not-found.tsx` | ✅ |
| 404 管理会員 | `admin/hanakai/members/[memberId]/not-found.tsx` | ✅ |
| 500 グローバル | `src/app/error.tsx` | ✅ |
| 500 イベント作成 | `events/create/error.tsx` | ✅ |
| 500 登録プロフィール | `register/profile/error.tsx` | ✅ |
| Loading | `events/loading.tsx` | ✅ |
| Loading その他 | `chats/loading.tsx` 等 | ⚠️ Connection 主要ページ（`/`, `/events`, `/my-profile`）に loading.tsx なし |

---

## 20. Supabase

### 20.1 HANAKAI Connection テーブル（18）

| テーブル | 用途 |
|----------|------|
| `hanakai_members` | 会員プロフィール |
| `hanakai_events` | イベント |
| `hanakai_event_applications` | 参加申込 |
| `hanakai_member_photos` | プロフィール写真 |
| `hanakai_connection_groups` | イベント後グループ |
| `hanakai_group_members` | グループメンバー |
| `hanakai_group_posts` | グループ投稿 |
| `hanakai_group_photos` | グループ写真 |
| `hanakai_group_photo_usage_requests` | 写真利用許可 |
| `hanakai_reports` | 通報 |
| `hanakai_member_social_links` | SNS リンク |
| `hanakai_account_deletion_requests` | 削除リクエスト |
| `hanakai_contact_inquiries` | お問い合わせ |
| `hanakai_notification_schedules` | 通知スケジュール |
| `hanakai_bloom_profiles` | Bloom プロフィール |
| `hanakai_bloom_timeline` | プロフィール変更履歴 |
| `hanakai_bloom_memories` | Bloom メモリ |
| `hanakai_bloom_versions` | Bloom バージョン |

### 20.2 レガシー Nurse Match テーブル（21+）

`users`, `female_profiles`, `male_profiles`, `identity_documents`, `profile_images`, `likes`, `favorites`, `daily_recommendations`, `interest_signals`, `credits`, `credit_transactions`, `matches`, `messages`, `message_reads`, `reports`, `blocks`, `admin_actions`, `admin_audit_logs`, `risk_checks`, `swipes`, `datefi_interests`

**注:** `auth.users`（Supabase Auth）は別管理。マイグレーション 33 ファイル（`supabase/migrations/`）。

---

## 21. API 一覧

| メソッド | パス | 用途 | 認証 |
|----------|------|------|------|
| GET | `/api/auth/callback` | OTP / OAuth セッション確立 | 公開 |
| POST | `/api/auth/set-password` | パスワード設定 | 要セッション |
| POST | `/api/hanakai/events/create` | イベント作成 | 要ログイン |
| POST | `/api/hanakai/bloom/generate-profile` | AI プロフィール生成 | 要ログイン |
| POST | `/api/hanakai/bloom/generate-introduction` | AI 自己紹介（**503 準備中**） | 要ログイン |
| POST | `/api/hanakai/bloom/generate-reflection` | AI 振り返り | 要ログイン |
| GET | `/api/debug/db-check` | DB 接続確認 | デバッグ |
| POST | `/api/debug/reset-test-users` | テストユーザーリセット | デバッグ |

### Server Actions（Connection 主要）

`createConnectionEventAction`, `applyConnectionEventAction`, `approveApplicationAction`, `rejectApplicationAction`, `confirmMemberAction`, `removeMemberAction`, `followMemberAction`, `sendMessageAction`（スタブ）, `saveProfileAction`, `updateMyProfileAction`, `deleteHanakaiAccountAction`, `postGroupMessageAction`, `submitReport`（report-actions）, 管理系 `admin*Action`

---

## 22. 未使用コンポーネント

Connection 本番導線から **参照されていない** または **レガシー専用** の主要コンポーネント:

| コンポーネント | 備考 |
|----------------|------|
| `user-safety-menu.tsx` | 旧マッチング（通報・ブロック）。Connection 未使用 |
| `male-daily-candidates.tsx` | 旧男性候補表示 |
| `profile-detail-modal.tsx` | 旧プロフィールモーダル |
| `activity-tabs.tsx` | 旧アクティビティ |
| `components/hanakai/cheer.tsx` | コイン応援（決済準備中モック） |
| `components/hanakai/shell.tsx` | 旧 Hanakai シェル（一部ページのみ） |
| `brand-character.tsx` | `BRAND_CHARACTERS_ENABLED=false` で null 返却（意図的無効化） |
| 旧 admin コンポーネント群 | `/admin/male`, `/admin/female` 等専用 |

**注:** 完全な dead code 解析（ツリーシェイキング）は未実施。上記はルート参照ベースの棚卸し。

---

## 23. 未完成ページ

| ページ | 問題 |
|--------|------|
| `/posts`, `/posts/new`, `/posts/[id]` | モックデータのみ |
| `/lives`, `/lives/[id]` | 「準備中」表示 |
| `/members`, `/members/[id]` | モック |
| `/support`, `/support/[id]` | モック |
| `/instructor`, `/concept` | モック |
| `/admin/connection/*` | モック・公開 |
| `/discover`, `/matches`, `/chats/*` | 旧マッチング（本番混乱リスク） |
| `/connections/[eventId]` | DM UI あり・送信スタブ |
| `/settings` | 通知設定 disabled |
| AI 関連パネル | `bio-ai-draft-panel`, `bloom-profile-panel` — 準備中表示 |

---

## 24. TODO 一覧

`src/` 内に `TODO` / `FIXME` / `HACK` コメントは **0 件**。

ただし「準備中」実装（実質 TODO）:

| 箇所 | 内容 |
|------|------|
| `sendMessageAction` | DM 未実装（console.log） |
| `bio-ai-draft-panel.tsx` | AI 下書き準備中 |
| `generate-introduction/route.ts` | 503 返却 |
| `header-user-menu.tsx` | 設定（準備中） |
| `settings/page.tsx` | 通知設定（準備中） |
| `lives/[id]/page.tsx` | 動画配信準備中 |
| `cheer.tsx` | 決済準備中モック |
| パスワードリセット | UI 未作成 |
| イベント編集・削除 | 未作成 |
| Connection ブロック | 未作成 |
| `/notifications` | 未作成 |

---

## 25. Apple 審査に不足している項目

**前提:** 現状は **ネイティブ iOS アプリなし**（Web/PWA のみ）。App Store 申請には Capacitor / React Native / Swift ラッパー等が必要。

| 項目 | 状態 | 重要度 |
|------|------|--------|
| ネイティブアプリバイナリ | ❌ なし | 必須 |
| アカウント作成 | ✅ Web で可能 | — |
| アカウント削除（アプリ内） | ✅ `/account/delete` | 必須 |
| プライバシーポリシー URL | ✅ 公開 | 必須 |
| 利用規約 URL | ✅ 公開 | 必須 |
| お問い合わせ手段 | ✅ `/contact` | 必須 |
| ユーザーコンテンツ通報 | ✅ 実装 | 必須（UGC） |
| ユーザーブロック | ❌ 未実装 | 必須（ソーシャル） |
| Sign in with Apple | ❌ 未実装 | 第三者ログイン時必須 |
| ダミー機能（DM スタブ） | ❌ UI のみ | リジェクトリスク大 |
| プッシュ通知説明 | ❌ なし | 利用時必須 |
| App Tracking Transparency | — | トラッキング時必須 |
| 年齢制限・コンテンツレーティング | ⚠️ 未整理 | 必須 |
| カメラ・写真ライブラリ用途説明 | ⚠️ Info.plist 未作成 | ネイティブ化時必須 |
| 決済（コイン等） | モックのみ | 実装時 IAP + 審査 |

---

## 26. Google Play 審査に不足している項目

**前提:** 同様に **ネイティブ Android アプリなし**。

| 項目 | 状態 | 重要度 |
|------|------|--------|
| AAB / APK | ❌ なし | 必須 |
| データセーフティフォーム | ⚠️ PP はあるがフォーム未記入 | 必須 |
| アカウント削除 | ✅ | 必須（2023〜要件） |
| UGC ポリシー（通報・モデレーション） | ✅ 通報 + 管理画面 | 必須 |
| ブロック機能 | ❌ | 強く推奨〜必須 |
| ダミー機能（DM） | ❌ | ポリシー違反リスク |
| デceptive Behavior（準備中画面の公開ルート） | ⚠️ `/lives`, `/posts` 等 | リスク |
| ファミリーポリシー / 年齢確認 | ⚠️ 未整理 | 対象次第必須 |
| 権限宣言（カメラ・ストレージ） | — | ネイティブ化時必須 |
| 決済 | モックのみ | Play Billing 必須（実装時） |

---

## 優先度分類（★★★★★ 必須 / ★★★★ 推奨 / ★★★ 将来）

### ★★★★★ 必須（Ver1.0 リリース・審査ブロッカー）

1. **Connection DM スタブの解消** — UI を非表示にするか、実送信を実装する（現状は誤解を招く）
2. **ブロック機能の Connection 統合** — `blocks` テーブルまたは `hanakai_*` 新設 + UI
3. **パスワードリセット UI** — 忘れた場合のメール送信フロー（Supabase `resetPasswordForEmail`）
4. **レガシー・モックルートの遮断** — `/admin/connection/*`, `/discover`, `/posts`, `/lives` 等を 404 または認証+リダイレクト
5. **通報機能の実動確認** — 本番で `hanakai_reports` への書き込み E2E 検証
6. **アカウント削除の本番 E2E** — `/account/delete` 完了フロー
7. **利用規約・プライバシー・お問い合わせの公開 URL 確認**（ストア申請用）
8. **ストア申請前: ネイティブアプリ化**（Capacitor 等）— 現状 Web のみでは Store 不可
9. **Sign in with Apple**（メール以外のソーシャルログイン追加時）
10. **参加者アプリ内キャンセル** — 申込後の辞退導線（メール依存のみは不十分）

### ★★★★ 推奨（品質・SEO・運用）

1. **イベント編集・削除**（ホスト向け）
2. **プロフィール編集で purposes / valueTags を保存** — `updateMyProfileAction` 修正
3. **sitemap 拡充** — `/events`, `/terms`, `/privacy`, `/contact`
4. **主要ページの `loading.tsx`** — `/events` 以外
5. **`/admin/connection` モック管理画面の削除または保護**
6. **重複パス整理** — `/delete-account` → `/account/delete` へ統一リダイレクト
7. **`/profile/edit` → `/my-profile` リダイレクト**
8. **メール通知の実送信** — 参加承認・週次ダイジェスト
9. **アプリ内通知一覧** `/notifications`（最低限の既読一覧）
10. **デバッグ API の本番無効化** — `/api/debug/*`
11. **community-guidelines を Connection シェルへ移行**
12. **OG 画像（`og:image`）の設定**
13. **Google Play データセーフティ / Apple プライバシーラベル整備**

### ★★★ 将来（Ver1.1 以降）

1. **コメント / スレッド機能**（グループ投稿への返信）
2. **汎用タイムライン `/posts` の Supabase 化**
3. **ライブ配信 `/lives`**
4. **Bloom AI 全機能**（自己紹介 AI、振り返り生成）
5. **Service Worker + オフライン + Web Push**
6. **WEDNESDAY アルファベットキャラクター再表示**（`BRAND_CHARACTERS_ENABLED`）
7. **コイン・決済（Stripe / IAP）**
8. **レガシー Nurse Match テーブル・ルートの完全削除**
9. **i18n（多言語）**
10. **ネイティブアプリ専用機能**（バイオメトリクス、共有シート等）

---

## 付録: チェックリスト（リリース前）

- [ ] 本番 E2E: 登録 → イベント申込 → 管理承認 → グループ投稿
- [ ] DM UI の非表示または実装
- [ ] ブロック機能
- [ ] パスワードリセット
- [ ] モックルート遮断
- [ ] `/api/debug/*` 本番無効化
- [ ] 利用規約・PP・問い合わせ URL をストア申請フォームに記載
- [ ] アカウント削除動作確認
- [ ] 通報 → 管理 inbox 動作確認
- [ ] レスポンシブ実機確認（iPhone / iPad / Desktop）
- [ ] Lighthouse（Performance / SEO / PWA）

---

*本レポートはコードベース静的監査に基づく。本番環境での実機・実データ検証は別途実施を推奨する。*
