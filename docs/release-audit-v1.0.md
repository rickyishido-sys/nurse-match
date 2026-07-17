# HANAKAI Connection Ver1.0 最終リリース監査

| 項目 | 内容 |
|------|------|
| 監査日 | 2026年7月17日 |
| ブランチ | `hanakai-v10-safety` |
| コミット | `5ef0012`（PR #1 未マージ） |
| Preview URL | https://nurse-match-beta-2ko3ce2mg-info-10353781s-projects.vercel.app |
| 本番URL（想定） | https://hanakai.kranz.design/ |
| 監査方式 | コード静的解析 + Preview E2E 実績 + iOS プロジェクト実物確認 + Vercel env 名確認（値は非表示） |
| Production デプロイ | **実施していない**（禁止遵守） |

---

## 1. 総合判定

### Web 本番公開

**判定: 条件付き可**

HANAKAI Ver1.0 のコア導線（登録・ログイン・プロフィール・本人確認・イベント閲覧/申込/作成・主催者管理・運営審査・通報/ブロック・退会）は Supabase 実装で存在し、Preview で Safety **32/32**・SNS **126/126** が通過している。ただし **法務同意の未実装、定員のサーバー未強制、通知の未配送、退会のソフト削除のみ、Production 環境変数の要確認** があり、現状のまま無条件公開は不可。

### App Store 申請

**判定: 申請不可**（Web 本番とは別判定）

Capacitor リモート WebView シェルは構成済みだが、**Info.plist 権限説明未設定、Privacy Manifest 未配置、Universal Links 未設定、審査用デモアカウント未整備、4.2 Minimum Functionality リスク** が残る。Web/PWA としてのサービス開始と iOS 申請は別スケジュールで進めるべき。

---

## 2. App Store 申請判定（詳細）

| 観点 | 判定 |
|------|------|
| アカウント削除をアプリ内から開始できるか | **可** — `/account/delete`、プロフィール/メニューから到達 |
| UGC 通報・ブロック・モデレーション | **可（Web 上）** — 通報 inbox・ブロック DB 保存・運営審査 UI 実装済み |
| Sign in with Apple 必須か | **現状不要** — メール/パスワードのみ。第三者 SSO 未提供 |
| 外部決済誘導 | **なし** — Stripe 未連携、10% 手数料は請求書フロー |
| 4.2 WebView ラッパー | **高リスク** — ネイティブ固有 UX ほぼなし |
| 権限説明文 | **NG** — Camera/Photo Library 未記載 |
| プライバシー申告準備 | **未完了** — App Privacy 未入力 |

**申請総合: 申請不可**（上記解消 + TestFlight ビルド成功後に **条件付き可** へ）

---

## 3. リリースブロッカー

### B1. V1.0 登録フローに利用規約・プライバシー同意がない

| 項目 | 内容 |
|------|------|
| 現状 | `/register` → `/register/profile` に同意チェックボックス・`terms_agreed_at` 等の DB 保存なし。レガシー `/register/details` のみ `agreeTerms` あり |
| ユーザー影響 | 法的同意の証跡が残らない |
| Apple 影響 | 審査・法務リスク（データ収集と規約の整合） |
| 修正内容 | オンボーディングに必須同意 UI + Server Action で検証 + 監査用タイムスタンプ保存 |
| 検証結果 | **NG**（コード確認のみ） |

**関連:** `src/app/register/page.tsx`, `src/components/connection/onboarding/onboarding-flow.tsx`, `src/lib/connection/actions.ts`

---

### B2. アカウント削除がソフト削除のみ（Auth ユーザー残存）

| 項目 | 内容 |
|------|------|
| 現状 | `deleteHanakaiAccountAction` → `hanakai_members.status=deleted` + PII マスク。UI に「認証アカウントは削除されません」と明記。Supabase `auth.users` は削除しない |
| ユーザー影響 | 退会後も認証レコードが残る。再ログイン試行は middleware/login で拒否 |
| Apple 影響 | **Guideline 5.1.1** — 削除開始は可能だが、完全削除期待とのギャップ。App Privacy 申告と文言の一致が必要 |
| 修正内容 | 法務判断の上、Auth ユーザー削除 or 保持理由の明確化 + プライバシーポリシー更新 |
| 検証結果 | **部分 OK** — アプリ内フローは実操作可能（Preview E2E 範囲外だが UI/Action 実装確認済み） |

**関連:** `src/app/account/delete/page.tsx`, `src/lib/connection/account-deletion.ts`

---

### B3. Production に `REGISTER_DEV_BYPASS_OTP` 環境変数が存在

| 項目 | 内容 |
|------|------|
| 現状 | Vercel Production env に `REGISTER_DEV_BYPASS_OTP` が登録されている（値は未確認） |
| ユーザー影響 | 値が `true` の場合、OTP バイパス・テストユーザー自動修復が有効化されうる |
| Apple 影響 | 間接（本番データ汚染・セキュリティ） |
| 修正内容 | Production から **削除** または確実に `false`/未設定。Preview のみに限定 |
| 検証結果 | **要人間確認**（env 名のみ確認、値は監査対象外） |

**関連:** `src/lib/actions.ts` L102, L636

---

### B4. イベント定員がサーバー側で強制されていない

| 項目 | 内容 |
|------|------|
| 現状 | `capacity` / `reservedCount` は表示用。`applyToEvent`・承認 API に定員チェックなし |
| ユーザー影響 | UI 上「満席」でも申込/承認が通りうる |
| Apple 影響 | 低（機能信頼性） |
| 修正内容 | `applyToEvent` / `adminApproveApplication` / `selectMemberForEvent` に定員検証 |
| 検証結果 | **NG**（コード確認） |

**関連:** `src/lib/connection/repo-supabase.ts`, `src/lib/connection/actions.ts`

---

### B5. 参加/作成メール等の通知が未配送（ログのみ）

| 項目 | 内容 |
|------|------|
| 現状 | `logParticipationDecisionEmail` 等は `console.log`。Cron は DB 通知レコード作成のみ |
| ユーザー影響 | 参加決定・リマインド等のメールが届かない |
| Apple 影響 | 低（プッシュ未使用なら権限不要） |
| 修正内容 | Supabase Auth メール以外のトランザクションメール送信基盤（Resend 等） |
| 検証結果 | **NG**（スタブ確認） |

**関連:** `src/lib/connection/notifications/participation-decision.ts`

---

### B6. RLS `hk_members_self_update` が trust/identity 列を制限していない

| 項目 | 内容 |
|------|------|
| 現状 | 認証ユーザーが自分の `hanakai_members` 行を広く UPDATE 可能。`identity_verified` 等の自己昇格理論上可能 |
| ユーザー影響 | 悪意あるクライアントで本人確認バイパスの可能性 |
| Apple 影響 | 間接（安全要件） |
| 修正内容 | RLS で `identity_verified`, `document_upload_status`, `trust_verification_status`, `safety_flags` 等を self-update 禁止 |
| 検証結果 | **NG**（マイグレーション確認。Server Action 経由は admin client 使用箇所あり） |

**関連:** `supabase/migrations/20260627_hanakai_connection_phase1.sql`

---

### B7. iOS Info.plist — 写真/Camera 権限説明・暗号化申告・Privacy Manifest 不足

| 項目 | 内容 |
|------|------|
| 現状 | `@capacitor/camera` 導入済み、プロフィール写真アップロードあり。Info.plist に `NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription` / `ITSAppUsesNonExemptEncryption` / `PrivacyInfo.xcprivacy` なし |
| ユーザー影響 | 写真選択時クラッシュ or 審査 Reject |
| Apple 影響 | **Reject 高確率** |
| 修正内容 | `native/hanakai/README.md` 記載のキー追加 + Privacy Manifest + Archive 成功確認 |
| 検証結果 | **NG**（`native/hanakai/ios/App/App/Info.plist` 実物確認） |

**注:** `native/hanakai/ios/` は `.gitignore` のため CI/clone 後の手動パッチ必須。

---

### B8. 法務ページがドラフト状態

| 項目 | 内容 |
|------|------|
| 現状 | `/terms`, `/privacy` に「専門家の確認を推奨」。`/legal/tokushoho` は運営者情報一部「お問い合わせ時開示」。`/community-guidelines` はレガシーシェル・4項目のみ |
| ユーザー影響 | 利用条件の明確性不足 |
| Apple 影響 | 日本向け特商法・UGC ポリシー不足で Reject/指摘 |
| 修正内容 | 法務レビュー + コミュニティガイドライン HANAKAI 版へ刷新 |
| 検証結果 | **NG**（ページ実装は存在、文言未確定） |

---

### B9. Production `HANAKAI_CONNECTION_BACKEND` / `NEXT_PUBLIC_USE_MOCK` の値未検証

| 項目 | 内容 |
|------|------|
| 現状 | Production env に両変数登録あり。Preview では `HANAKAI_CONNECTION_BACKEND=supabase` 未設定時に `/login`↔`/home` ループが発生した実績 → `5ef0012` で identity 修正 + Preview branch env 追加済み |
| ユーザー影響 | mock backend や demo auth が Production で有効だと全機能が破綻 |
| Apple 影響 | 間接 |
| 修正内容 | Production で `HANAKAI_CONNECTION_BACKEND=supabase`, `NEXT_PUBLIC_USE_MOCK` 未設定/false を人間確認 |
| 検証結果 | **要人間確認** |

---

## 4. 非ブロッカー（Ver1.1 以降）

| 項目 | 理由 |
|------|------|
| メールアドレス変更 | 未実装だが V1.0 必須機能リスト外なら後回し可 |
| 1:1 DM | グループ投稿・通報で代替。`message_future` は placeholder |
| テキスト検索（イベント） | カテゴリ絞り込みのみ。一覧 UX は成立 |
| Stripe 決済連携 | 請求書フローで運用開始可能（手動） |
| Universal Links / カスタム URL scheme | Web ブラウザ/PWA では不要。iOS 申請前に対応 |
| イベント `almost_full` / `full` 自動ステータス | 表示は `reservedCount` で代替 |
| ESLint 248 warnings / 18 errors | ビルドは成功。品質改善は継続 |
| iOS プロジェクトの git 追跡 | 運用方針として `cap add ios` + 手順書で可 |
| レビュー/評価導線 | Bloom timeline あり。星評価 UI は限定的 |
| `/debug/env` | 管理者のみ。Production で admin 以外到達不可を要確認 |

---

## 5. Apple 申請準備一覧

| 項目 | 状態 | メモ |
|------|------|------|
| App Name | 草案あり | Store: **HANAKAI Connection** / 端末表示: **華会 HANAKAI** — 表記統一要 |
| Subtitle | 未確定 | `docs/store-submission/store-metadata.md` |
| Description | 草案あり | `docs/store-submission/app-store-description-ja.md` |
| Keywords | 未確定 | |
| Category | 草案 | Social Networking |
| Age Rating | 要設定 | 利用規約 18+。登録 UI で年齢確認要実地確認 |
| Privacy Policy URL | **可** | https://hanakai.kranz.design/privacy |
| Support URL | **可** | https://hanakai.kranz.design/contact |
| Marketing URL | **可** | https://hanakai.kranz.design/ |
| App Privacy | **未入力** | `docs/store-submission/privacy-data-inventory.md` ドラフト |
| Review Notes | 草案あり | `docs/store-submission/review-notes.md` |
| Demo Account | **未作成** | `docs/store-submission/review-account-template.md` |
| Screenshots | **未作成** | `docs/store-submission/screenshot-plan.md` |
| App Icon | 部分 | PWA `public/icon.png` あり / Store 1024 は要最終 |
| Build | **未アップロード** | Bundle ID: `design.kranz.hanakai`, v1.0 build 1 |
| TestFlight | **未実施** | |

---

## 6. 機能別監査サマリー

### 6.1 認証・アカウント

| 機能 | 実装 | DB | 権限 | Preview 実操作 | 判定 |
|------|------|-----|------|----------------|------|
| 新規登録 | ✅ | ✅ | ✅ OTP | E2E login 系で間接確認 | OK |
| メール認証 | ✅ | Supabase Auth | ✅ | 同上 | OK |
| ログイン/ログアウト | ✅ | ✅ | ✅ middleware | E2E 全ステップ | OK |
| セッション維持 | ✅ | Cookie | ✅ | E2E 複数ロール | OK |
| パスワードリセット | ✅ | ✅ | ✅ | E2E 範囲外、コード確認 | OK |
| メール変更 | ❌ | — | — | — | **未実装** |
| プロフィール編集 | ✅ | ✅ | ✅ RLS | E2E SNS/プロフィール | OK |
| 本人確認 | ✅ | ✅ | ✅ server gate | **32/32 UI+admin** | OK |
| 退会/削除 | 部分 | ✅ soft | ✅ | UI+Action 確認 | **条件付き** |
| 規約/プライバシー同意 | 部分 | ❌ | ❌ V1.0 | — | **NG** |

**本人確認サーバー強制:** `requireIdentityVerifiedMember()` が `createConnectionEventAction`, `applyConnectionEventAction`, 承認系で使用 — **OK**（E2E step 2-5, 17-18 で検証）

**アカウント削除:** `/account/delete` からフォーム送信 — 問い合わせ案内のみでは **ない** — **OK**

---

### 6.2 イベント利用者導線

| 機能 | 実装 | サーバー強制 | E2E/備考 |
|------|------|--------------|----------|
| 一覧/カテゴリ | ✅ | — | E2E step 1 |
| テキスト検索 | ❌ | — | 非ブロッカー |
| 詳細/参加申請 | ✅ | ✅ identity | E2E 17 |
| 未確認ブロック | ✅ | ✅ 403 | E2E 2, 5 |
| 重複申込防止 | ✅ | ✅ UNIQUE | コード確認 |
| 定員 | 表示のみ | ❌ | **B4** |
| キャンセル | ✅ | ✅ admin client | コード確認、E2E 範囲外 |
| 4桁チェックイン | ✅ | ✅ hash+rate limit | コード確認 |
| 参加通知メール | ❌ | — | **B5** |
| 空データ表示 | ✅ | — | 未確認 |

---

### 6.3 主催者導線

| 機能 | 実装 | サーバー強制 | 備考 |
|------|------|--------------|------|
| イベント作成 | ✅ | ✅ identity + API | E2E 18 |
| 編集/削除/キャンセル | ✅ | ✅ host check | コード確認 |
| 10% サービス料 | ✅ | ✅ calculator | 請求書生成、Stripe なし |
| 参加者管理/コード | ✅ | ✅ | host panel |
| 本人確認必須 | ✅ | ✅ | E2E 4-6 |

---

### 6.4 メッセージ・UGC・安全

| 機能 | 実装 | DB 保存 | 管理画面 | 判定 |
|------|------|---------|----------|------|
| 1:1 DM | ❌ | — | — | 非ブロッカー（V1.0） |
| グループ投稿 | ✅ | ✅ | ホスト hide | OK |
| ブロック | ✅ | ✅ | — | UI 制限のみ、apply 未連動 |
| 通報 | ✅ | ✅ | `/admin/hanakai/reports` | OK |
| SNS 表示 | ✅ | ✅ | — | **126/126 PASS** |
| javascript: URL 拒否 | ✅ | ✅ normalize | E2E 24 |

---

### 6.5 管理画面

| 機能 | 実装 | Preview 実操作 | 判定 |
|------|------|----------------|------|
| 管理者認証 | ✅ | E2E admin login | OK |
| 一般ユーザー拒否 | ✅ | E2E forbidden 検証 | OK |
| 本人確認審査 | ✅ | **UI 承認/再提出 PASS** | OK |
| 通報 inbox | ✅ | コード確認 | OK |
| 参加申請 | ✅ | コード確認 | OK |
| SERVICE_ROLE クライアント露出 | ❌ なし | — | `SUPABASE_SERVICE_ROLE_KEY` は server only |

**レガシー `/admin/connection/*`:** `hanakai-route-policy.ts` で **404** — 本番経路から遮断 **OK**

---

### 6.6 法務・Apple

| ページ | 存在 | リンク | 文言 |
|--------|------|--------|------|
| `/terms` | ✅ | ✅ | ドラフト |
| `/privacy` | ✅ | ✅ | ドラフト |
| `/legal/tokushoho` | ✅ | 部分 | 要完成 |
| `/contact` | ✅ | ✅ | OK |
| `/community-guidelines` | ✅ | 部分 | **レガシー** |
| `/account/delete` | ✅ | ✅ menu | OK |

---

### 6.7 iOS

| 項目 | 状態 |
|------|------|
| Bundle ID | `design.kranz.hanakai` |
| 表示名 | 華会 HANAKAI |
| Version / Build | 1.0 / 1 |
| 本番 URL | HTTPS `https://hanakai.kranz.design/` |
| App Icon | Assets あり |
| Launch Screen | Storyboard あり |
| Info.plist 権限 | **不足** |
| git 管理 | **ios/ gitignore** |
| 4.2 リスク | **高** — リモート WebView のみ |

---

### 6.8 UX・レスポンシブ

| Viewport | 確認方法 | 結果 |
|----------|----------|------|
| 390px | E2E screenshots | Safety + SNS PASS |
| 768px | 同上 | PASS |
| 1280px | 同上 | PASS |

未確認: DM 画面（未実装）、通知 inbox（未実装）

---

### 6.9 セキュリティ

| 項目 | 判定 |
|------|------|
| RLS 基本方針 | ✅ テーブル単位ポリシーあり |
| identity 自己昇格 | ❌ B6 |
| Open Redirect | login `next` は `/` 始まりのみ — OK |
| javascript: SNS | ✅ reject |
| 署名付き URL（本人確認書類） | ✅ admin repo |
| mock 認証本番 | 要確認 B9 |
| E2E アカウント本番混入 | テストドメイン使用 — 要運用ポリシー |
| bypass secret ログ | ✅ `5ef0012` で redact |

---

### 6.10 パフォーマンス・品質

| 項目 | 結果 |
|------|------|
| `pnpm build` | **PASS**（2026-07-17 監査時） |
| `pnpm lint` | **FAIL** — 18 errors, 248 warnings |
| `tsc --noEmit` | **PASS** |
| Preview Safety E2E | **32/32 PASS** |
| Preview SNS E2E | **126/126 PASS** |
| Production deploy | **未実施** |

---

## 7. 検証証拠

### Preview

- URL: https://nurse-match-beta-2ko3ce2mg-info-10353781s-projects.vercel.app
- コミット: `5ef0012ea065fe2de35acc8f1c0e84d1759e56d0`
- Safety レポート: `scripts/e2e-screenshots/hanakai-v10-safety/2026-07-17T07-14-09-843Z-report.json`
- SNS レポート: `scripts/e2e-screenshots/hanakai-v10-sns-preview/2026-07-17T07-23-46-293Z-report.json`
- スクリーンショット: 上記 stamp 配下 `*-390.png`, `*-768.png`, `*-1280.png`

### E2E で確認した主要画面

- ログイン、イベント一覧/詳細/作成、本人確認（未提出/確認中/再提出/verified）
- 運営本人確認審査（**UI 操作、DB フォールバックなし**）
- 公開/自分プロフィール SNS アイコン（10 プラットフォーム）
- レスポンシブ 3 サイズ

### 未確認（要ステージング/本番 Promote 前の人手確認）

- 新規登録 OTP 端到端（本番 Supabase メール）
- パスワードリセットメール端到端
- Production 環境変数の実値
- 実機 iOS Archive / TestFlight
- 全管理画面の実データ操作（Preview admin env 依存）
- Lighthouse / Core Web Vitals

---

## 8. 最終結論

| 判断 | 結論 |
|------|------|
| **Web 本番デプロイ** | **条件付き可** — B1, B3, B4, B6, B8, B9 を解消またはリスク受容のうえ Promote。Preview E2E 32/32 + SNS 126/126 は **リリース品質の強い証拠** |
| **App Store 申請** | **申請不可（現時点）** — B7 + 審査アカウント + App Privacy + 4.2 対策 + B2 文言整合が必要。Web 先行リリースは可能 |
| **PR #1** | 監査時点で未マージ。`5ef0012` の Preview 修正はマージ前にレビュー推奨 |
| **Production デプロイ** | **実施しない**（監査遵守） |

### リリースまでの最小チェックリスト（Web）

1. Production: `HANAKAI_CONNECTION_BACKEND=supabase`, `NEXT_PUBLIC_USE_MOCK` 無効, `REGISTER_DEV_BYPASS_OTP` 削除
2. V1.0 登録に規約/プライバシー同意を追加
3. 定員サーバー強制 or 運用で定員超過を手動防止する旨を明記
4. RLS で identity/trust 列の self-update 禁止
5. 法務ページ確定 + コミュニティガイドライン刷新
6. PR #1 マージ → Preview 再検証 → **その後** Production Promote（別途承認）

### App Store までの最小チェックリスト

1. Info.plist 権限 + Privacy Manifest + Archive
2. 審査用デモアカウント/イベント
3. App Privacy 入力
4. 4.2 対策（Review Notes + 必要ならネイティブ affordance 追加）
5. TestFlight 内部テスト

---

*本ドキュメントは `hanakai-v10-safety` @ `5ef0012` 時点の監査結果です。Production にはデプロイしていません。*
