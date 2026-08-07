# ストアメタデータ一覧

HANAKAI Connection Ver1.0 の App Store / Google Play 共通メタデータです。

| 項目 | 内容 |
|------|------|
| 最終更新 | 2026年7月14日 |
| 本番URL | https://hanakai.kranz.design/ |
| 提供事業者 | RePowera株式会社 |

---

## 基本情報

| フィールド | App Store | Google Play | 値 |
|------------|-----------|-------------|-----|
| アプリ名 | App 名 | アプリ名 | HANAKAI Connection |
| 短縮名 | — | — | HANAKAI |
| バンドル ID / パッケージ名 | `design.kranz.hanakai` | `design.kranz.hanakai` | 設定済み（Xcode / capacitor.config 一致） |
| SKU（Apple） | `[要設定]` | — | 例: `hanakai-connection-ios` |
| バージョン（CFBundleShortVersionString） | 1.0 | 1.0 | Ver1.0（MARKETING_VERSION） |
| ビルド番号（CFBundleVersion） | 1 | 1 | CURRENT_PROJECT_VERSION（設定済み） |
| 対応デバイス | iPhone のみ | スマートフォン | **iPhone 専用**（TARGETED_DEVICE_FAMILY = 1） |
| プライマリカテゴリ | ソーシャルネットワーキング | ソーシャル | — |
| 言語（デフォルト） | 日本語 | 日本語 | ja |

> ✅ バンドル ID / バージョン / ビルド番号は iOS プロジェクト（`native/hanakai/ios/App/App.xcodeproj/project.pbxproj`）に設定済みです。
> ⚠️ **要人間対応:** SKU は初回登録時に決定してください。

---

## URL 一覧

| 用途 | URL |
|------|-----|
| 本番サイト | https://hanakai.kranz.design/ |
| プライバシーポリシー | https://hanakai.kranz.design/privacy |
| 利用規約 | https://hanakai.kranz.design/terms |
| コミュニティガイドライン | https://hanakai.kranz.design/community-guidelines |
| お問い合わせ | https://hanakai.kranz.design/contact |
| アカウント削除 | https://hanakai.kranz.design/account/delete |

---

## アプリアイコン

| プラットフォーム | サイズ | ファイル（リポジトリ内） |
|------------------|--------|--------------------------|
| 共通（PWA） | 512×512 | `/public/icon.png` |
| Apple Touch Icon | 180×180 | `/public/apple-touch-icon.png` |
| Maskable（Android） | 512×512 | `/public/icons/icon-maskable.svg` |

### ストア提出用（要生成）

| プラットフォーム | サイズ | 状態 |
|------------------|--------|------|
| App Store | 1024×1024 PNG（透過なし） | `[要生成]` |
| Google Play | 512×512 PNG | `[要生成]` |
| Adaptive Icon（Android） | 前景 432×432 / 背景 | `[要生成]` |

> ⚠️ **要人間対応:** ストア用高解像度アイコンの最終デザイン確認・書き出しが必要です。

---

## スプラッシュ / 起動画面

| 項目 | 方針 |
|------|------|
| 背景色 | `#F8F7F3`（manifest `background_color`） |
| テーマカラー | `#2F6F62`（manifest `theme_color`） |
| ロゴ | HANAKAI ブランドロゴ / アイコン |

Capacitor ネイティブビルド時は `capacitor.config` および各プラットフォームの Splash 設定を参照（`native-build-guide.md`）。

---

## PWA メタデータ（Web 側）

`src/app/manifest.ts` より:

| フィールド | 値 |
|------------|-----|
| name | HANAKAI Connection |
| short_name | HANAKAI |
| description | 知らない人同士がリアルで出会う、週替わりのイベントコミュニティ。 |
| start_url | / |
| display | standalone |
| orientation | portrait |

---

## 課金・収益化

| 項目 | 値 |
|------|-----|
| Apple In-App Purchase（IAP） | **不使用** |
| サブスクリプション | **なし** |
| 広告 | **なし** |
| HANAKAI利用料 | **税込500円**（イベント参加決定時にSquareでカード決済） |
| 決済の性質 | 実世界の対面イベント参加に伴う料金（デジタルコンテンツ販売ではない） |
| IAP対象外の根拠 | App Store Review Guideline 3.1.3(e) / 3.1.5(a)（実世界サービスへの対価） |
| 当日費用（飲食・体験・入場料等） | HANAKAIでは徴収せず、店舗・会場・主催者へ当日直接支払い |

> ✅ 決済は「実世界サービスへの対価」であり Apple IAP の対象外です。Review Notes に 3.1.3(e)/3.1.5(a) を根拠として明記してください。
> ⚠️ **要確認（ストア）:** 本番の Square 環境変数・Webhook・Cron の設定はリリース前に別途完了させてください（本メタデータの対象外）。

---

## 権限（ネイティブラッパー）

Capacitor ラッパーで要求する想定権限:

| 権限 | 用途 | 必須 |
|------|------|------|
| インターネット | WebView による本番サイト表示 | はい |
| カメラ / 写真ライブラリ | プロフィール・グループ写真アップロード | はい（ユーザー操作時のみ） |
| 位置情報（常時） | — | **使用しない** |
| 位置情報（使用中のみ） | — | **使用しない** |
| プッシュ通知 | Ver1.0 では未実装 | いいえ |
| マイク | — | 使用しない |

> ⚠️ **要確認（Apple / Google）:** Info.plist / AndroidManifest の権限説明文（Usage Description）を日本語で記載し、実際の利用と一致させてください。

---

## 対象地域・配信

| 項目 | 推奨 |
|------|------|
| 初期配信地域 | 日本 |
| 価格 | 無料 |
| デバイス | iPhone / iPad（iOS）、Android スマートフォン |

---

## 連絡先（ストア掲載用）

| 項目 | 値 |
|------|-----|
| 会社名 | RePowera株式会社 |
| サポートメール | `[要設定]` |
| サポート電話 | `[要設定: 任意]` |
| 住所 | `[要設定: 法人登記住所]` |

> ⚠️ **要確認（法務）:** ストアに掲載する法人情報は登記情報と一致させる必要があります。

---

## 関連ドキュメント

| ファイル | 内容 |
|----------|------|
| `app-store-description-ja.md` | App Store 説明文 |
| `google-play-description-ja.md` | Google Play 説明文 |
| `privacy-data-inventory.md` | データ収集棚卸し |
| `review-notes.md` | 審査用メモ |
| `review-account-template.md` | 審査用アカウント |
| `screenshot-plan.md` | スクリーンショット計画 |
| `native-build-guide.md` | Capacitor ビルド手順 |
| `release-checklist.md` | リリースチェックリスト |
