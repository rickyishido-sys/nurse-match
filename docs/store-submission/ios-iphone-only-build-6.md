# iOS Build 1.0 (6) — iPhone 専用 Archive / Upload

| 項目 | 値 |
|------|-----|
| 作成日 | 2026-08-11 |
| Bundle ID | `design.kranz.hanakai` |
| Version | `1.0` |
| Build | `6` |
| Device Family | **iPhone only** (`TARGETED_DEVICE_FAMILY=1`) |
| Production URL | `https://hanakai.kranz.design/` |
| 前提 | ASC 最新 Build **1.0 (5)** は Device Family = iPhone, iPad（Universal）→ 方針不一致 |

---

## Cloud Agent 制約（重要）

この作業の **Archive / Validation / App Store Connect Upload は macOS + Xcode + Apple Developer 署名が必要**です。

Cloud Agent（Linux）では以下が不可です:

- Xcode / `xcodebuild`
- Distribution 証明書・Provisioning Profile へのアクセス
- Organizer からの ASC Upload

そのためリポジトリ側では:

1. iPhone 専用化の永続設定（`ios-config` + sync 後自動適用）
2. Version 1.0 / Build 6
3. Mac で実行する手順

までを準備し、**Upload 自体は人間の Mac で実施**してください。

---

## STEP 1 調査結果（なぜ "1,2" だったか）

| 項目 | 内容 |
|------|------|
| Capacitor | `native/hanakai/capacitor.config.ts` — `appId=design.kranz.hanakai`, `server.url=https://hanakai.kranz.design/` |
| iOS プロジェクト | `native/hanakai/ios/` は **gitignore**。各マシンで `cap add ios` 生成 |
| `TARGETED_DEVICE_FAMILY` | Capacitor iOS テンプレート既定値 **`"1,2"`**（Universal） |
| Build 番号 | 生成直後の `CURRENT_PROJECT_VERSION` / Xcode の Version・Build |
| 過去手順 | `docs/ios-release-checklist-v1.0.md`（削除済み履歴）: Xcode Organizer → Validate → Distribute → ASC |
| 署名 | Capacitor 雛形は `CODE_SIGN_STYLE = Automatic`。Team は提出 Mac の既存設定を流用 |
| Info.plist 権限 | 追跡ファイル `ios-config/Info.plist.additions.xml` を sync 後マージ |

Build 1.0 (5) が Universal だった主因: **Capacitor 既定の `"1,2"` を Archive 前に iPhone 専用へ固定していなかった**。

---

## STEP 2–3 リポジトリ変更（永続化）

| ファイル | 役割 |
|----------|------|
| `native/hanakai/ios-config/release.json` | Version / Build / Device Family / Bundle ID の正本 |
| `native/hanakai/ios-config/Info.plist.additions.xml` | Camera / Photo / URL Scheme / 暗号化申告 |
| `native/hanakai/scripts/apply-ios-config.mjs` | `project.pbxproj` を `TARGETED_DEVICE_FAMILY=1` 等へ書き換え + plist マージ |
| `native/hanakai/scripts/sync.mjs` | `cap sync` 後に必ず `apply-ios-config` を実行 |
| `package.json` | `cap:add:ios` 後も apply、`ios:apply-config` スクリプト追加 |

`cap add ios` で再び `"1,2"` になっても、sync / apply で **1 に戻る**。

---

## STEP 4 Archive 前チェック（Mac で確認）

```bash
cd native/hanakai
npm ci
npm run cap:add:ios          # ios/ が無い場合のみ
npm run cap:sync:ios         # sync + apply-ios-config
# または既に ios/ がある場合:
npm run ios:apply-config
```

`project.pbxproj` で確認:

```bash
rg "TARGETED_DEVICE_FAMILY|MARKETING_VERSION|CURRENT_PROJECT_VERSION|PRODUCT_BUNDLE_IDENTIFIER" \
  ios/App/App.xcodeproj/project.pbxproj
```

期待値:

| キー | 値 |
|------|-----|
| `TARGETED_DEVICE_FAMILY` | `1`（`"1,2"` が残っていないこと） |
| `MARKETING_VERSION` | `1.0` |
| `CURRENT_PROJECT_VERSION` | `6` |
| `PRODUCT_BUNDLE_IDENTIFIER` | `design.kranz.hanakai` |

追加確認:

- [ ] Production URL が `https://hanakai.kranz.design/`（`capacitor.config.ts`）
- [ ] Info.plist に Camera / Photo 説明文あり
- [ ] Splash / StatusBar 設定を変えていない
- [ ] Web / Square / Supabase コードに不要変更なし
- [ ] 審査用アカウント・イベントを触っていない

Xcode GUI でも: Target **App** → **General** → **Supported Destinations** が **iPhone** のみ。

---

## STEP 5 Mac での Archive / Upload（人間操作）

Build 1.0 (5) を上げた **同じ Mac / 同じ Apple Team / Automatic Signing** を使ってください。

```bash
cd native/hanakai
npm ci
npm run cap:sync:ios
npm run cap:open:ios
```

Xcode:

1. Signing & Capabilities → Team を選択（既存の提出用 Team）
2. Scheme: **App** / Destination: **Any iOS Device (arm64)**
3. **Product → Archive**
4. Organizer → 該当 Archive → **Validate App**（App Store Connect、既存配布証明書）
5. 成功後 → **Distribute App → App Store Connect → Upload**
6. Submit for Review **しない**
7. 既存 Build の削除 **しない**

CLI 代替（好みで）:

```bash
cd native/hanakai/ios/App
xcodebuild -scheme App -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath /tmp/HANAKAI-1.0.6.xcarchive archive

xcodebuild -exportArchive \
  -archivePath /tmp/HANAKAI-1.0.6.xcarchive \
  -exportOptionsPlist /path/to/ExportOptions-appstore.plist \
  -exportPath /tmp/HANAKAI-1.0.6-export
```

`ExportOptions-appstore.plist` は Build 5 アップロード時に使った設定を流用（method=`app-store`）。

---

## STEP 6 アップロード後 — 人間が ASC で確認

Processing 完了後:

1. App Store Connect → **HANAKAI**
2. **Build Activity**（または TestFlight / バージョン 1.0 のビルド一覧）
3. **1.0 (6)** を開く
4. **一般 / General** → **デバイス条件 / Device Requirements**
5. **デバイスファミリーが「iPhone」のみ**であることを確認（「iPhone、iPad」ではない）

この確認が終わるまで **App Store スクリーンショット撮影は開始しない**。

---

## やらないこと

- Submit for Review
- App Store 公開
- 既存 Build 削除
- 審査用データ削除・変更
- Bundle ID 変更
- 実課金発生操作
