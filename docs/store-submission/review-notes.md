# ストア審査用メモ（Review Notes）

App Store / Google Play 審査チーム向けの説明メモです。各ストアの「審査メモ」「審査に関する情報」欄に転記してください。

| 項目 | 内容 |
|------|------|
| アプリ名 | HANAKAI Connection Ver1.0 |
| 本番URL | https://hanakai.kranz.design/ |
| 提供事業者 | RePowera株式会社 |
| 最終更新 | 2026年8月7日 |

---

## 英語版（App Store 推奨 — 審査チームは英語対応）

```
HANAKAI Connection is a community app for real-world, in-person events (walks, cafes, flower workshops, etc.). Members create a profile, complete mandatory identity verification, browse events, apply to attend, and meet in person. Members can also host their own events, select participants, and use report/block safety tools.

WHAT THIS APP DOES (native value, not just a website)
- Installable iOS app with a native splash screen, status-bar integration, and iOS permission handling.
- Uses the device Camera and Photo Library to capture and upload profile photos and identity-verification documents.
- Provides an integrated membership experience: account + email verification, mandatory identity verification, event discovery/participation, event hosting, and safety tools (report/block), designed for repeated real-world use.

TEST ACCOUNT (pre-verified — please use this)
- Username / Password: see the "App Review Information" fields (and review-account-template.md).
- This account is already identity-approved, so you can immediately test apply/create flows.
- Login: https://hanakai.kranz.design/login

KEY FLOWS TO TEST (Ver1.0)
1. Log in with the test account.
2. Browse events: /events → open an event detail.
3. Apply to an event. Before the first application, the app asks you to register a payment card (see PAYMENTS). You may stop after the card form to avoid any charge.
4. View/edit profile and identity verification: /my-profile
5. Manage saved payment cards: /my-profile/payment-methods
6. Create / edit / cancel an event: /events/create, /events/edit/[id]
7. Report a member or event (Report button on profile / event pages).
8. Block a member (Block button on a member profile); manage blocks at /account/blocked
9. Account deletion — fully in-app, no external link: /account/delete

PAYMENTS (this is NOT Apple In-App Purchase)
- The only fee is a HANAKAI usage fee of JPY 500 (tax included).
- It is charged ONLY when a member is selected to attend a real, in-person event. It is a fee for a physical, real-world service (in-person event participation) — not digital content, not a subscription, and it does not unlock any app feature.
- Per App Store Review Guideline 3.1.3(e) / 3.1.5(a), payment for real-world services may be processed outside Apple In-App Purchase. We process it with Square. Card data is tokenized by Square; we never store the full card number.
- Other event-day costs (food, activity, entry fees) are paid directly to the venue or host, NOT collected by HANAKAI.
- To avoid a real charge during review: register the test card and stop. You are not charged unless a host selects you for an event.

IDENTITY VERIFICATION
- Identity verification is MANDATORY for all users. After the operator approves the submitted document, the member can apply to events and create events.
- The provided test account is already approved so review is not blocked.

LOCATION
- No continuous or background location tracking. Residence area is free text (e.g., "Tokyo"), not GPS.

USER-GENERATED CONTENT & SAFETY
- Profile photos, event descriptions, and participant group posts/photos.
- Report: users can report members, profiles, events, and group content. Reports are stored for operator review in the internal moderation dashboard.
- Block: users can block members. Blocking immediately removes the blocked member's content from the blocker's Community/Group feed and participant lists (server-side). Blocking also creates an admin-visible moderation record (no email spam). Operators can review these records in the dashboard.
- Terms of Service (including prohibitions / reporting / suspension) and Privacy Policy are linked from the login and registration screens before sign-in.

AGE REQUIREMENT
- 18+ per our Terms of Service.

SUPPORT
- Contact form: https://hanakai.kranz.design/contact
- Privacy Policy: https://hanakai.kranz.design/privacy
- Terms: https://hanakai.kranz.design/terms
- Community Guidelines: https://hanakai.kranz.design/community-guidelines

Please contact us via the support email if you need an additional test account or a fresh test event.
```

---

## 日本語版（Google Play 審査メモ欄用）

```
【アプリ概要】
HANAKAI Connection は、散歩・カフェ・花などのリアルな対面イベントを探して参加・主催できるコミュニティアプリです。会員登録・本人確認（必須）・イベント参加・主催・通報／ブロックまでをアプリ内で提供します。

【ネイティブとしての価値】
- インストール型のiOS/Androidアプリ（ネイティブSplash、ステータスバー連携、OS権限管理）
- カメラ／写真ライブラリを使ったプロフィール写真・本人確認書類の撮影とアップロード
- 会員認証・本人確認・イベント参加・主催・安全機能を統合した継続利用サービス

【審査用アカウント（本人確認承認済み）】
メール: [REVIEW_EMAIL_PLACEHOLDER]
パスワード: [REVIEW_PASSWORD_PLACEHOLDER]
ログイン: https://hanakai.kranz.design/login

【確認いただきたい機能（Ver1.0）】
1. ログイン
2. イベント一覧・詳細・参加申込（/events）
3. プロフィール・本人確認（/my-profile）
4. 支払いカード管理（/my-profile/payment-methods）
5. イベントの作成・編集・中止
6. 通報（Reportボタン）
7. ブロック（Blockボタン、一覧: /account/blocked）
8. アカウント削除（/account/delete）

【課金について（アプリ内課金ではありません）】
- 徴収するのはHANAKAI利用料 税込500円のみ。
- 実世界の対面イベントへの参加が決定した時点でのみ課金します（実世界サービスへの対価。デジタルコンテンツ／サブスク／機能アンロックではありません）。
- Squareでカード決済。カード情報はSquareがトークン化し、完全なカード番号は保存しません。
- 飲食代・体験料・入場料などはHANAKAIでは徴収せず、店舗・会場・主催者へ当日直接お支払いいただきます。
- 審査時に実課金を避けるには、カード登録画面の確認までで留めてください（選定されない限り課金されません）。

【位置情報】
常時・バックグラウンド追跡なし。居住エリアはテキスト入力のみ。

【年齢制限】
利用規約上、18歳以上が対象です。

【サポート】
https://hanakai.kranz.design/contact
```

---

## サービス性質の補足（出会い系誤判定防止）

| 項目 | 説明 |
|------|------|
| サービス種別 | イベント型コミュニティ（マッチングアプリではない） |
| 主要導線 | イベント閲覧 → プロフィール作成 → 本人確認 → 参加申込 → リアル体験 |
| スワイプ型マッチング | なし |
| 位置ベースの近隣検索 | なし |
| 常時位置追跡 | なし |

> ⚠️ **要確認（ストア）:** ソーシャル / 出会い系カテゴリの扱いは審査担当者の判断に依存します。リジェクト時は上記の補足を再提出してください。

---

## ログインが必要な機能

| 機能 | パス | 審査アカウント必要 |
|------|------|-------------------|
| イベント参加申込・キャンセル | `/events/[id]` | はい |
| 支払いカード管理 | `/my-profile/payment-methods` | はい |
| プロフィール・本人確認 | `/my-profile` | はい |
| イベント作成・編集・中止 | `/events/create`, `/events/edit/[id]` | はい |
| 通報 | 各所 Report ボタン | はい |
| ブロック | プロフィール Block ボタン | はい |
| アカウント削除 | `/account/delete` | はい |
| 参加者一覧 | `/connections/[eventId]` | はい（参加済みイベント必要） |

---

## 審査前の事前準備（社内）

審査提出前に以下を完了してください:

1. **審査用アカウントの作成** — `review-account-template.md` 参照
2. **本人確認の承認** — 審査アカウントを管理画面で承認済みにする（`/admin/hanakai/identity-reviews`）
3. **参加可能なイベントの用意** — 審査期間中に有効なイベントを1件以上公開
4. **本番 URL の安定稼働確認**
5. **レガシールートの無効化確認** — 旧マッチング系ページ（/discover, /matches 等）が 404 であること
6. **公開トップページと Ver1.0 実機能の一致確認**

> ⚠️ **要人間対応:** 審査用イベントの日程・内容は実際の運営スケジュールと調整してください。

---

## 既知の制限事項（審査員への正直な開示）

Ver1.0 で意図的に提供していない機能:

| 機能 | 状態 |
|------|------|
| DM（メッセージ送信） | Ver1.0 スコープ外（UI 非表示） |
| 投稿・コメント・ライブ | Ver1.0 スコープ外（ルート 404） |
| 投げ花・応援 | Ver1.0 スコープ外 |
| イベント後のアプリ内交流 | Ver1.0 スコープ外 |
| プッシュ通知 | 未実装（権限要求なし） |
| アプリ内通知一覧 | 未実装 |

---

## リジェクト時の対応フロー

1. リジェクト理由の原文を保存
2. 該当ガイドライン（Guideline X.X）を特定
3. `release-audit.md` と照合して修正
4. 審査メモを更新して再提出
5. 必要に応じて Apple / Google へ Appeal（上訴）

---

## 人間対応が必要な項目

| 項目 | 担当 | 内容 |
|------|------|------|
| Apple Developer Program | 人間 | 年間登録・法人確認 |
| App Store Connect 設定 | 人間 | メタデータ入力・ビルドアップロード・App Privacy 入力 |
| Google Play Console 設定 | 人間 | メタデータ・AAB アップロード |
| 審査用アカウント発行・本人確認承認 | 人間 | Supabase でユーザー作成 + 本人確認承認 |
| 審査メモ最終確認 | 人間 | 英語版の誤字・機能説明の正確性 |
| サポートメール監視 | 人間 | 審査期間中の Apple / Google からの連絡対応 |
