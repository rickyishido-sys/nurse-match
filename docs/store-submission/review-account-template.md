# 審査用アカウント テンプレート

App Store / Google Play 審査チーム向けのテストアカウント情報テンプレートです。提出前に実際の認証情報で埋めてください。

| 項目 | 内容 |
|------|------|
| 最終更新 | 2026年7月14日 |
| 本番URL | https://hanakai.kranz.design/ |
| ログインURL | https://hanakai.kranz.design/login |

> ⚠️ **要人間対応:** 以下のプレースホルダーを実際の値に置き換えてからストアに提出してください。本ファイルを Git にコミットする場合は、**本番パスワードを含めない**でください。

---

## プライマリ審査アカウント

| フィールド | 値 |
|------------|-----|
| 用途 | メイン審査用（イベント参加・通報・ブロック・削除テスト） |
| メールアドレス | `[REVIEW_EMAIL_PLACEHOLDER]` |
| パスワード | `[REVIEW_PASSWORD_PLACEHOLDER]` |
| ニックネーム | `[REVIEW_NICKNAME_PLACEHOLDER]` 例: `審査太郎` |
| 年代 | `[REVIEW_AGE_PLACEHOLDER]` 例: `30代` |
| 居住エリア | `[REVIEW_AREA_PLACEHOLDER]` 例: `東京都` |
| プロフィール写真 | 登録済み（審査用ダミー画像） |
| オンボーディング | 完了済み |
| 本人確認 | **承認済み（必須）** — 未承認だとイベント参加・作成に進めません |
| 支払いカード | 任意（審査員が /events/[id] のカード登録画面を確認できればよい。実課金は発生させない） |

### App Store Connect 入力欄

```
Username: [REVIEW_EMAIL_PLACEHOLDER]
Password: [REVIEW_PASSWORD_PLACEHOLDER]
```

### Google Play Console 入力欄

審査メモ（`review-notes.md`）内に同じ認証情報を記載してください。

---

## セカンダリ審査アカウント（通報・ブロックテスト用）

通報・ブロック機能のテストには、対象となる別アカウントが必要です。

| フィールド | 値 |
|------------|-----|
| 用途 | 通報・ブロックの対象メンバー |
| メールアドレス | `[REVIEW_TARGET_EMAIL_PLACEHOLDER]` |
| パスワード | `[REVIEW_TARGET_PASSWORD_PLACEHOLDER]` |
| ニックネーム | `[REVIEW_TARGET_NICKNAME_PLACEHOLDER]` 例: `審査花子` |

---

## 審査用イベント設定

審査員が参加申込〜グループフィードまで確認できるよう、以下を事前設定してください。

| フィールド | 値 |
|------------|-----|
| イベント名 | `[REVIEW_EVENT_TITLE_PLACEHOLDER]` 例: `【審査用】カフェで語ろう` |
| イベント URL | `https://hanakai.kranz.design/events/[EVENT_ID]` |
| 開催日 | `[REVIEW_EVENT_DATE_PLACEHOLDER]` — 審査期間中に有効な日付 |
| カテゴリ | カフェ |
| エリア | 東京都 |
| HANAKAI利用料 | 税込500円（参加決定時にSquareで課金）。当日の飲食代等はHANAKAIでは徴収しない |
| プライマリ審査アカウントの申込状態 | **承認済み（approved）** |

> ⚠️ **要人間対応:** 管理画面（`/admin/hanakai/applications`）で審査アカウントの参加申込を承認してください。
> ⚠️ **実課金の回避:** 審査員には「カード登録画面の確認まで」を案内し、参加者選定（=課金）は行わないでください。選定されない限り課金は発生しません。

---

## アカウント作成手順（Supabase）

### 1. Supabase Auth でユーザー作成

1. Supabase Dashboard → Authentication → Users → Add user
2. 審査用メールアドレスとパスワードを設定
3. 「Auto Confirm User」を有効にする（メール OTP 不要にする）

### 2. HANAKAI メンバープロフィール作成

審査アカウントで以下の導線を完了させるか、DB に直接投入:

1. `https://hanakai.kranz.design/login` でログイン
2. `/register/profile` 以降のオンボーディングを完了
3. `/my-profile` の「本人確認」から本人確認書類を提出
4. 管理画面 `/admin/hanakai/identity-reviews` で当該会員の本人確認を**承認**（必須。未承認だと参加・作成不可）
5. `/my-profile` でプロフィール・写真・本人確認「承認済み」が表示されることを確認

### 3. 動作確認チェックリスト

- [ ] ログイン成功
- [ ] `/home` に遷移
- [ ] `/events` でイベント一覧表示
- [ ] 審査用イベントの詳細表示
- [ ] `/my-profile` で本人確認が「承認済み」表示
- [ ] `/my-profile` でプロフィール編集可能
- [ ] イベント申込時にカード登録画面（Squareフォーム）が表示される
- [ ] `/my-profile/payment-methods` で支払いカード管理画面が表示される（200）
- [ ] 他メンバープロフィールで通報ボタン表示
- [ ] 他メンバープロフィールでブロックボタン表示
- [ ] `/account/blocked` でブロック一覧表示
- [ ] `/account/delete` で削除画面表示（**審査アカウントでは実行しない**）

---

## 審査員向け操作ガイド（日本語）

### ログイン

1. アプリを起動
2. ログイン画面でメールアドレスとパスワードを入力
3. ホーム画面（`/home`）が表示されます

### イベントの確認

1. 下部ナビまたは `/events` からイベント一覧を開く
2. 審査用イベントをタップして詳細を確認
3. 参加申込済みの場合、参加ステータスが表示されます

### 決済・カード登録の確認（実課金なし）

1. イベント詳細で参加申込に進むと、初回はカード登録画面（Squareフォーム）が表示されます
2. カード登録画面が表示されることを確認してください（登録まででOK）
3. HANAKAI利用料 税込500円は、主催者が参加者を「選定」したタイミングでのみ課金されます
4. 審査では選定を行わないため、**実際の課金は発生しません**
5. 登録済みカードの管理は `/my-profile/payment-methods` で確認できます

### 通報の確認

1. イベント詳細または他メンバーのプロフィールを開く
2. 「通報」ボタンをタップ
3. カテゴリを選択して送信

### ブロックの確認

1. 他メンバーのプロフィールを開く
2. 「ブロックする」ボタンをタップ
3. `/account/blocked` でブロック一覧を確認
4. 「ブロック解除」で元に戻せます

### アカウント削除の確認

1. `/account/delete` にアクセス（ログイン必須）
2. 削除手続き画面が表示されることを確認
3. **審査用アカウントでは実際の削除は行わないでください**

---

## セキュリティ注意事項

| 項目 | 方針 |
|------|------|
| パスワードの Git 管理 | **禁止** — 環境変数またはパスワード管理ツールで管理 |
| 審査後のアカウント | パスワード変更または削除を推奨 |
| 本番データへの影響 | 審査アカウントは `is_test_user` フラグの設定を検討 |
| アカウント削除テスト | 審査用アカウントでは実行しない |

> ⚠️ **要確認（運営）:** 審査終了後のテストアカウントの扱い（保持 / 削除）を運営方針として決定してください。

---

## App Store Connect — App Review Information

| フィールド | 入力値 |
|------------|--------|
| Sign-in required? | Yes |
| Username | `[REVIEW_EMAIL_PLACEHOLDER]` |
| Password | `[REVIEW_PASSWORD_PLACEHOLDER]` |
| Contact First Name | `[要設定]` |
| Contact Last Name | `[要設定]` |
| Contact Phone | `[要設定]` |
| Contact Email | `[要設定: サポートメール]` |
| Notes | `review-notes.md` の英語版を転記 |

> ⚠️ **要人間対応:** App Store Connect の App Review Information は提出者の連絡先が必須です。
