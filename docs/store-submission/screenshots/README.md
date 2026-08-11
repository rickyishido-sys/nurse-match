# App Store スクリーンショット成果物

| 項目 | 値 |
|------|-----|
| 更新 | 2026-08-11 |
| 対象サイズ | **1290 × 2796**（Apple 6.9" Display 受理サイズ = 旧 6.7" / iPhone 15 Pro Max クラス） |
| 出典 | [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications) |
| Production | https://hanakai.kranz.design |
| ASC アップロード | **未実施** |

---

## 現状ステータス: BLOCKED（認証情報不足）

6枚完成には **App Store 審査用アカウント**でのログインが必須です。

| 確認 | 結果 |
|------|------|
| `HANAKAI_REVIEW_EMAIL` / `HANAKAI_REVIEW_PASSWORD` | 環境に未設定 |
| `.env.secrets.local` | なし |
| ドキュメントの審査用テンプレート | プレースホルダのみ |
| 既存 E2E フォールバックアカウント | Production で `invalid-credentials`（使用不可・方針上も不使用） |

未ログインでは次が完成しません:

- ホーム（`/home`）
- 参加申請の「参加理由」フォーム（本番はカード登録 UI が先に出る）
- プロフィール（`/my-profile`）
- コミュニティの参加記録（空状態のみ）
- イベント作成（ログイン必須）

また未ログインの参加導線には **Square カード番号入力 UI** が表示されます。  
App Store スクショでは **カード番号 / MM/YY / CVV を絶対に含めない**ため、審査用アカウント（カード登録済みが望ましい）での撮影が必要です。

---

## 人間がやること（最短）

1. Cursor / 実行環境にシークレットを設定:
   - `HANAKAI_REVIEW_EMAIL`
   - `HANAKAI_REVIEW_PASSWORD`
2. またはリポジトリ直下に gitignore 済み `.env.secrets.local` を作成（チャットに貼らない）
3. 実行:

```bash
cd /workspace   # or repo root
npm ci
npx playwright install chromium
node scripts/capture-app-store-screenshots.mjs
```

4. 出力先: `docs/store-submission/screenshots/ios-6.7/`
5. `manifest.json` と PNG 6枚を確認後、ASC アップロードは別タスク

---

## 推奨6枚（スクリプト出力名）

| # | ファイル | 画面 |
|---|----------|------|
| 1 | `01-events-list-1290x2796.png` | イベント一覧 |
| 2 | `02-event-detail-1290x2796.png` | イベント詳細 |
| 3 | `03-event-apply-1290x2796.png` | 参加申請（カードUI非表示・未送信） |
| 4 | `04-profile-1290x2796.png` | プロフィール |
| 5 | `05-community-1290x2796.png` | コミュニティ |
| 6 | `06-host-create-1290x2796.png`（または manage） | 主催者体験 |

---

## サイズ検証メモ（Agent）

Playwright `viewport 430×932` × `deviceScaleFactor 3` → **1290×2796** を確認済み（PNG・非透過）。  
App Store Connect の 6.9" Display 枠にそのままアップロード可能な寸法です。
