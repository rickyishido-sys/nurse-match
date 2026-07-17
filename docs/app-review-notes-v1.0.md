# HANAKAI Ver1.0 — App Review Notes

Apple 審査チーム向けメモ。App Store Connect の「App Review Information」に転記してください。

---

## サービス概要（日本語）

**HANAKAI** は、散歩・カフェ・花などの**リアル体験イベント**を通じて、知らない人同士が自然につながるコミュニティサービスです。スワイプ型マッチングアプリではなく、**実際の体験への参加申込・審査・当日の交流**が中心です。

- 本番 URL: https://hanakai.kranz.design/
- 対象: 18歳以上
- Ver1.0: イベント参加・プロフィール・本人確認・グループ交流・アカウント削除

---

## This is NOT a website wrapper（英語 — 審査向け）

HANAKAI is a **hybrid native app** (Capacitor) that loads our production web application but provides **native iOS capabilities**:

- **Camera / Photo Library** for profile photos and identity document upload
- **Persistent login session** via Supabase Auth
- **In-app navigation** for events, profile, group participation, and account settings
- **Account deletion** at `/account/delete` (deletes Supabase Auth user server-side)

The app is not a generic browser for arbitrary websites. All content is served from our HANAKAI service domain.

---

## 主要機能（アプリ内完結）

| 機能 | 操作手順 |
|------|----------|
| 新規登録 | 登録 → メール認証 → **利用規約・PP同意** → パスワード → プロフィール |
| イベント参加 | ホーム / イベント一覧 → 詳細 → 参加申込 → 主催者/運営承認 |
| 本人確認 | プロフィール登録時または `/my-profile` → 書類アップロード（カメラ/写真） |
| 交流 | 参加確定イベントの**グループフィード**（投稿・写真） |
| ブロック / 通報 | プロフィールまたは管理画面から |
| アカウント削除 | ログイン → `/account/delete` → 確認 → 削除（Auth 削除含む） |

**Ver1.0 に 1:1 DM はありません。** イベントグループ内の投稿で交流します。

---

## イベント参加の流れ（審査用）

1. ログイン後、イベント一覧から体験を選択
2. 「参加申込」→ 本人確認済みの場合のみ申込可能
3. 主催者または運営が承認
4. イベント当日、グループフィードで交流

---

## 本人確認

- 運転免許証・マイナンバーカード等を**任意**でアップロード
- 運営が `/admin/hanakai/identity-reviews` で審査
- 書類 URL は本人と管理者のみ RLS で保護

---

## アカウント削除手順（Guideline 5.1.1）

1. アプリにログイン
2. マイプロフィール下部「アカウントを削除する」、または `/account/delete`
3. 削除内容を確認しチェック → 「アカウントを削除する」
4. サーバー側で Auth ユーザーと個人データを削除・匿名化
5. ログアウト後、同メールで再ログイン不可

---

## 審査用アカウント

> ⚠️ **提出前に実アカウントを作成し、以下を埋めてください。**

| 項目 | 値 |
|------|-----|
| Email | `[審査用メール]` |
| Password | `[審査用パスワード]` |
| プロフィール | 登録完了済み |
| 本人確認 | `[approved / pending]` |
| イベント参加 | `[参加済みイベント名]` |

### 確認してほしい導線

1. ログイン
2. イベント一覧 → 詳細
3. マイプロフィール → 写真追加（カメラ/ライブラリ）
4. グループフィード（参加済みイベントがあれば）
5. `/terms`, `/privacy` 表示
6. `/account/delete`（**審査後にアカウント削除されるため、別途再作成可**）

---

## Guideline 4.2（Minimum Functionality）

本アプリは単なる Web サイト表示ではありません:

- ネイティブカメラ/写真連携
- イベント参加ライフサイクル（申込→審査→確定→グループ）
- 本人確認フロー
- アカウント削除（Auth 削除）

プッシュ通知は Ver1.1 で追加予定。Ver1.0 では上記機能で十分なアプリ体験を提供します。

---

## 暗号化

`ITSAppUsesNonExemptEncryption = false`  
HTTPS（TLS）のみ。独自暗号化は使用しません。App Store Connect では **No** を選択。

---

## 連絡先

| 項目 | 値 |
|------|-----|
| サポート URL | `[要設定]` |
| プライバシーポリシー | https://hanakai.kranz.design/privacy |
| 利用規約 | https://hanakai.kranz.design/terms |

---

## App Store 表示名（確定値）

- **名前:** HANAKAI：体験から始まる、新しいつながり。
- **サブタイトル:** 趣味や体験を通じて、新しい出会い。

（リポジトリ内 `docs/store-submission/app-store-description-ja.md` とは文言が異なります。Connect 提出時は上記を使用。）
