# ストア審査用メモ（Review Notes）

App Store / Google Play 審査チーム向けの説明メモです。各ストアの「審査メモ」「審査に関する情報」欄に転記してください。

| 項目 | 内容 |
|------|------|
| アプリ名 | HANAKAI Connection Ver1.0 |
| 本番URL | https://hanakai.kranz.design/ |
| 提供事業者 | RePowera株式会社 |
| 最終更新 | 2026年7月14日 |

---

## 英語版（App Store 推奨 — 審査チームは英語対応）

```
HANAKAI Connection Ver1.0 is a community app for real-world weekly events (walks, cafes, flowers, etc.). Users discover events, create a profile, apply to participate, and attend in person.

ARCHITECTURE:
- This is a Capacitor wrapper around our production PWA hosted at https://hanakai.kranz.design/
- The native app loads the production web app in a WebView. No separate native UI.

TEST ACCOUNT:
See the credentials provided in the "App Review Information" section (or attached review-account-template.md).
Login URL: https://hanakai.kranz.design/login

KEY FEATURES TO TEST (Ver1.0):
1. Login with the test account
2. Browse events: /events
3. View event detail and apply / cancel participation
4. View/edit profile: /my-profile
5. Create / edit / cancel an event: /events/create, /events/edit/[id]
6. Report a member or event (Report button on profile/event pages)
7. Block a member (Block button on member profile) — manage at /account/blocked
8. Account deletion: /account/delete (login required)

NOT IN Ver1.0 (intentionally removed or deferred):
- Direct messages / DM
- Posts / comments / timeline
- Live streaming
- Tipping / cheer / in-app payments
- Post-event in-app community messaging

PAYMENTS:
- No in-app purchases
- No subscriptions
- Event fees (if any) are paid on-site at the event venue, NOT in the app

LOCATION:
- We do NOT use continuous or background location tracking
- Users may enter a text-based residence area (e.g., "Tokyo") in their profile — this is NOT GPS data

USER-GENERATED CONTENT:
- Profile photos and event descriptions
- Report and block features are available
- Admin moderation via internal dashboard

AGE REQUIREMENT:
- Users must be 18+ per our Terms of Service

SUPPORT:
- Contact form: https://hanakai.kranz.design/contact
- Privacy Policy: https://hanakai.kranz.design/privacy
- Terms: https://hanakai.kranz.design/terms

Please contact us via the support email if you need additional test accounts or event setup.
```

---

## 日本語版（Google Play 審査メモ欄用）

```
【アプリ概要】
HANAKAI Connection Ver1.0 は、週替わりのリアルイベント（散歩・カフェ・花など）を探して参加申請できるコミュニティアプリです。

【技術構成】
本番 PWA（https://hanakai.kranz.design/）を Capacitor でラップした WebView アプリです。ネイティブ専用 UI はありません。

【審査用アカウント】
メール: [REVIEW_EMAIL_PLACEHOLDER]
パスワード: [REVIEW_PASSWORD_PLACEHOLDER]
ログイン: https://hanakai.kranz.design/login

【確認いただきたい機能（Ver1.0）】
1. ログイン
2. イベント一覧・詳細・参加申込・キャンセル（/events）
3. プロフィール閲覧・編集（/my-profile）
4. イベントの作成・編集・中止
5. 通報（イベント・メンバーの Report ボタン）
6. ブロック（メンバープロフィールの Block ボタン、一覧: /account/blocked）
7. アカウント削除（/account/delete）

【Ver1.0で提供していない機能】
メッセージ・DM、投稿・コメント、ライブ配信、投げ花・応援・決済、イベント後のアプリ内交流

【課金】
アプリ内課金・サブスクリプションはありません。イベント参加費がある場合は当日会場での現地払いです。

【位置情報】
常時・バックグラウンドでの位置追跡は行いません。居住エリアはテキスト入力のみです。

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
| 主要導線 | イベント閲覧 → プロフィール作成 → 参加申込 → リアル体験 |
| スワイプ型マッチング | なし |
| 位置ベースの近隣検索 | なし |
| 常時位置追跡 | なし |

> ⚠️ **要確認（ストア）:** ソーシャル / 出会い系カテゴリの扱いは審査担当者の判断に依存します。リジェクト時は上記の補足を再提出してください。

---

## ログインが必要な機能

| 機能 | パス | 審査アカウント必要 |
|------|------|-------------------|
| イベント参加申込・キャンセル | `/events/[id]` | はい |
| プロフィール編集 | `/my-profile?mode=edit` | はい |
| イベント作成・編集・中止 | `/events/create`, `/events/edit/[id]` | はい |
| 通報 | 各所 Report ボタン | はい |
| ブロック | プロフィール Block ボタン | はい |
| アカウント削除 | `/account/delete` | はい |
| 参加者一覧 | `/connections/[eventId]` | はい（参加済みイベント必要） |

---

## 審査前の事前準備（社内）

審査提出前に以下を完了してください:

1. **審査用アカウントの作成** — `review-account-template.md` 参照
2. **参加可能なイベントの用意** — 審査期間中に有効なイベントを1件以上公開
3. **審査用アカウントをイベントに承認済みにする**
4. **本番 URL の安定稼働確認**
5. **レガシールートの無効化** — 旧マッチング系ページが審査員に露出しないこと
6. **公開トップページと Ver1.0 実機能の一致確認**

> ⚠️ **要人間対応:** 審査用イベントの日程・内容は実際の運営スケジュールと調整してください。

---

## 既知の制限事項（審査員への正直な開示）

Ver1.0 で意図的に提供していない機能:

| 機能 | 状態 |
|------|------|
| DM（メッセージ送信） | Ver1.0 スコープ外（UI 非表示） |
| 投稿・コメント・ライブ | Ver1.0 スコープ外（ルート 404） |
| 投げ花・応援・決済 | Ver1.0 スコープ外 |
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
| App Store Connect 設定 | 人間 | メタデータ入力・ビルドアップロード |
| Google Play Console 設定 | 人間 | メタデータ・AAB アップロード |
| 審査用アカウント発行 | 人間 | Supabase でユーザー作成 |
| 審査メモ最終確認 | 人間 | 英語版の誤字・機能説明の正確性 |
| サポートメール監視 | 人間 | 審査期間中の Apple / Google からの連絡対応 |
