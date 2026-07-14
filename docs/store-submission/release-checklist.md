# ストアリリースチェックリスト

HANAKAI Connection Ver1.0 の App Store / Google Play 提出前チェックリストです。

| 項目 | 内容 |
|------|------|
| 最終更新 | 2026年7月14日 |
| 本番URL | https://hanakai.kranz.design/ |
| 提供事業者 | RePowera株式会社 |
| 参照 | `docs/release-audit.md` |

---

## 凡例

- ✅ = 完了
- ⬜ = 未完了
- ⚠️ = 要確認 / 人間対応必須
- 🔴 = ブロッカー（提出前に必ず解消）

---

## A. 法務・ポリシー

| # | 項目 | 状態 | 備考 |
|---|------|------|------|
| A1 | 利用規約（`/terms`）の法務確認 | ⚠️ | 専門家の正式確認が必要 |
| A2 | プライバシーポリシー（`/privacy`）の法務確認 | ⚠️ | ストア申告と完全一致必須 |
| A3 | コミュニティガイドラインの整備 | ⬜ | `/community-guidelines` |
| A4 | 18歳以上の年齢制限の明記 | ✅ | 利用規約に記載済み |
| A5 | アカウント削除の容易なアクセス | ✅ | `/account/delete` |
| A6 | 本人確認書類の取扱いポリシー確定 | ⚠️ | 保存先・保持期間の正式定義 |
| A7 | サポート窓口の運用体制 | ⚠️ | `/contact` の返信 SLA |
| A8 | 第三者サービス DPA 確認 | ⚠️ | Supabase / Vercel / OpenAI |

---

## B. プロダクト・機能

| # | 項目 | 状態 | 備考 |
|---|------|------|------|
| B1 | ログイン / 登録 | ✅ | |
| B2 | イベント一覧・詳細・参加申込 | ✅ | |
| B3 | プロフィール閲覧・編集 | ✅ | |
| B4 | 通報機能 | ✅ | ReportButton |
| B5 | ブロック機能 | ✅ | `/account/blocked` |
| B6 | 参加者一覧（/connections） | ✅ | フォロー・DM なし |
| B7 | アカウント削除 | ✅ | `/account/delete` |
| B8 | パスワードリセット UI | ✅ | `/forgot-password` |
| B9 | DM（メッセージ送信） | ✅ | Ver1.0 スコープ外・UI 非表示 |
| B10 | レガシールートの無効化 | ✅ | middleware 404 |
| B11 | プッシュ通知 | ⬜ | Ver1.0 スコープ外（権限要求なし） |
| B12 | アプリ内課金 | ✅ | なし（確認済み） |

---

## C. プライバシー・データ（ストア申告）

| # | 項目 | 状態 | 備考 |
|---|------|------|------|
| C1 | データ棚卸し完了 | ✅ | `privacy-data-inventory.md` |
| C2 | App Store App Privacy 入力 | ⬜ | Connect で入力 |
| C3 | Google Play Data safety 入力 | ⬜ | Console で入力 |
| C4 | 位置情報の非収集を申告 | ✅ | 常時追跡なし |
| C5 | データ削除機能の申告 | ✅ | アカウント削除あり |

---

## D. ストアメタデータ

| # | 項目 | 状態 | 備考 |
|---|------|------|------|
| D1 | App Store 説明文 | ✅ | `app-store-description-ja.md` |
| D2 | Google Play 説明文 | ✅ | `google-play-description-ja.md` |
| D3 | キーワード / カテゴリ | ⚠️ | 正式確定が必要 |
| D4 | スクリーンショット | ⬜ | `screenshot-plan.md` |
| D5 | アプリアイコン（ストア用） | ⬜ | 1024×1024 / 512×512 |
| D6 | フィーチャーグラフィック（Android） | ⬜ | 1024×500 |
| D7 | サポート URL | ✅ | `/contact` |
| D8 | プライバシーポリシー URL | ✅ | `/privacy` |

---

## E. 審査準備

| # | 項目 | 状態 | 備考 |
|---|------|------|------|
| E1 | 審査用アカウント作成 | ⬜ | `review-account-template.md` |
| E2 | 審査用イベント公開 | ⬜ | 審査期間中に有効なイベント |
| E3 | 審査メモ（英語） | ✅ | `review-notes.md` |
| E4 | 審査メモ（日本語） | ✅ | `review-notes.md` |
| E5 | デモ手順の動作確認 | ⬜ | 審査員向け導線テスト |

---

## F. ネイティブビルド（Capacitor）

| # | 項目 | 状態 | 備考 |
|---|------|------|------|
| F1 | Capacitor 初期セットアップ | ⬜ | `native-build-guide.md` |
| F2 | バンドル ID / パッケージ名決定 | ⚠️ | 人間判断 |
| F3 | iOS ビルド成功 | ⬜ | Xcode Archive |
| F4 | Android AAB ビルド成功 | ⬜ | `./gradlew bundleRelease` |
| F5 | iOS 権限説明文（日本語） | ⬜ | カメラ・写真のみ |
| F6 | Android 権限（最小限） | ⬜ | 位置情報なし |
| F7 | スプラッシュ画面 | ⬜ | ブランドカラー設定 |
| F8 | 実機テスト（iOS） | ⬜ | |
| F9 | 実機テスト（Android） | ⬜ | |

---

## G. 開発者アカウント・署名（要人間）

| # | 項目 | 状態 | 備考 |
|---|------|------|------|
| G1 | Apple Developer Program 登録 | ⚠️ | 年間 $99 |
| G2 | Google Play Console 登録 | ⚠️ | $25 一回 |
| G3 | iOS 証明書・プロビジョニング | ⚠️ | Developer Portal |
| G4 | Android 署名キー生成・保管 | ⚠️ | 紛失不可 |
| G5 | App Store Connect アプリ作成 | ⚠️ | |
| G6 | Google Play アプリ作成 | ⚠️ | |

---

## H. 本番環境

| # | 項目 | 状態 | 備考 |
|---|------|------|------|
| H1 | 本番 URL 安定稼働 | ✅ | https://hanakai.kranz.design/ |
| H2 | SSL 証明書有効 | ✅ | |
| H3 | Supabase 本番環境 | ✅ | |
| H4 | Vercel 本番デプロイ最新 | ✅ | |
| H5 | エラー監視 | ⚠️ | Sentry 等の導入を検討 |

---

## I. 最終提出（要人間）

| # | 項目 | 状態 | 備考 |
|---|------|------|------|
| I1 | iOS ビルドを App Store Connect にアップロード | ⬜ | Xcode Organizer |
| I2 | Android AAB を Google Play にアップロード | ⬜ | Play Console |
| I3 | App Store メタデータ入力完了 | ⬜ | |
| I4 | Google Play メタデータ入力完了 | ⬜ | |
| I5 | 審査用アカウント情報入力 | ⬜ | |
| I6 | スクリーンショットアップロード | ⬜ | |
| I7 | コンテンツレーティング回答 | ⬜ | IARC / Apple |
| I8 | 審査提出（Submit for Review） | ⬜ | |
| I9 | 審査結果の監視・対応 | ⬜ | |

---

## J. 提出後

| # | 項目 | 状態 | 備考 |
|---|------|------|------|
| J1 | 審査リジェクト対応手順の準備 | ✅ | `review-notes.md` |
| J2 | リリースノート作成 | ⬜ | |
| J3 | 社内関係者への周知 | ⬜ | |
| J4 | 審査用アカウントのパスワード変更 | ⬜ | 審査完了後 |
| J5 | ストア掲載情報の社内共有 | ⬜ | |

---

## ブロッカー一覧（提出前に解消必須）

| 優先度 | 項目 | 対応方針 |
|--------|------|----------|
| P0 | レガシールート公開（`/admin/connection/*` 等） | 認証必須化 or 無効化 |
| P0 | DM スタブ UI | 非表示 or 実装 |
| P1 | パスワードリセット UI | ログイン画面にリンク追加 |
| P1 | Capacitor ビルド未セットアップ | `native-build-guide.md` 手順実施 |
| P1 | 審査用アカウント・イベント未準備 | `review-account-template.md` |
| P1 | スクリーンショット未撮影 | `screenshot-plan.md` |
| P2 | 法務確認未完了 | 利用規約・プライバシーポリシー |
| P2 | 開発者アカウント未登録 | Apple / Google 登録 |

---

## 提出可否判定

| 条件 | 現状 |
|------|------|
| ブロッカー（P0）すべて解消 | 🔴 未達 |
| 法務確認完了 | ⚠️ 未確認 |
| ネイティブビルド成功 | ⬜ 未実施 |
| 審査用アカウント準備 | ⬜ 未実施 |
| メタデータ・スクリーンショット準備 | ⚠️ ドキュメントのみ |

**総合判定: ストア提出不可（ドキュメント整備完了、実装・ビルド・法務確認が残存）**

---

## 関連ドキュメント

| ファイル | 用途 |
|----------|------|
| `docs/release-audit.md` | 技術監査レポート |
| `app-store-description-ja.md` | App Store 説明文 |
| `google-play-description-ja.md` | Google Play 説明文 |
| `store-metadata.md` | メタデータ一覧 |
| `privacy-data-inventory.md` | データ棚卸し |
| `review-notes.md` | 審査メモ |
| `review-account-template.md` | 審査用アカウント |
| `screenshot-plan.md` | スクリーンショット |
| `native-build-guide.md` | ビルド手順 |
