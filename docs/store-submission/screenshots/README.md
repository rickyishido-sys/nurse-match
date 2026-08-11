# App Store スクリーンショット成果物

| 項目 | 値 |
|------|-----|
| 更新 | 2026-08-11 |
| 対象サイズ | **1290 × 2796**（Apple 6.9" Display 受理サイズ = 旧 6.7" / iPhone 15 Pro Max クラス） |
| 出典 | [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications) |
| Production | https://hanakai.kranz.design |
| ログイン | App Review 一般ユーザー「レビュー太郎」（`.env.secrets.local` の `HANAKAI_REVIEW_*`） |
| ASC アップロード | **未実施** |

---

## 現状ステータス: READY FOR HUMAN REVIEW

6枚を Production から生成済み。App Store Connect へのアップロードは行っていません。

| # | ファイル | 画面 | 検証 |
|---|----------|------|------|
| 1 | `ios-6.7/01-events-list-1290x2796.png` | イベント一覧 | 1290×2796 / PNG / 非透過 |
| 2 | `ios-6.7/02-event-detail-1290x2796.png` | イベント詳細（審査用） | 同上 |
| 3 | `ios-6.7/03-event-apply-1290x2796.png` | 参加申請（カード入力非表示・未送信） | 同上 |
| 4 | `ios-6.7/04-profile-1290x2796.png` | プロフィール（レビュー太郎） | 同上 |
| 5 | `ios-6.7/05-community-1290x2796.png` | コミュニティ | 同上 |
| 6 | `ios-6.7/06-host-create-1290x2796.png` | イベント作成（未作成） | 同上 |

補足:

- 参加申請画面は Production 上カード未登録のため参加理由フォームの前に Square ゲートがある。スクショではカード入力 UI を非表示にし、申請コピーのみ撮影（カード登録・申請送信なし）。
- ヘッダーのメール表示とサイトフッターは掲載用に撮影時のみ非表示。
- `manifest.json` に撮影メタデータあり。

---

## 再生成

```bash
node scripts/capture-app-store-screenshots.mjs
```

認証情報は `.env.secrets.local` の `HANAKAI_REVIEW_EMAIL` / `HANAKAI_REVIEW_PASSWORD`（値はログに出さない）。

---

## サイズメモ

Playwright `viewport 430×932` × `deviceScaleFactor 3` → **1290×2796**（PNG・非透過）。  
App Store Connect の 6.9" Display 枠にそのままアップロード可能な寸法です。
