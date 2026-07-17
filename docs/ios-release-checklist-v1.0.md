# HANAKAI Ver1.0 — iOS Release Checklist

| 項目 | 値 |
|------|-----|
| 更新日 | 2026-07-18 |
| Bundle ID | `design.kranz.hanakai` |
| Marketing Version | 1.0 |
| Build Number | 1 |
| Capacitor 本番 URL | `https://hanakai.kranz.design/` |
| 最終判定 | **TestFlight 未完了** |

---

## 1. Xcode プロジェクト設定

| 項目 | 期待値 | 状態 | 備考 |
|------|--------|------|------|
| Bundle Identifier | `design.kranz.hanakai` | ✅ 確認済 | `capacitor.config.ts` |
| Display Name | 華会 HANAKAI | ✅ | App Store 名とは別（Connect で設定） |
| Version | 1.0 | ✅ | |
| Build | 1 | ✅ | 提出前に increment |
| Development Team | Apple Developer 登録チーム | ⚠️ 人間確認 | Xcode Signing & Capabilities |
| Signing (Release) | Automatic / Distribution | ⚠️ 未検証 | Archive 時に確認 |
| Deployment Target | iOS 14+（Capacitor 8 推奨） | ⚠️ 人間確認 | project.pbxproj |
| Supported Devices | iPhone | ⚠️ 人間確認 | |
| Orientations | Portrait 優先 | ✅ Info.plist | Landscape も許可あり |
| Xcode / iOS SDK | 最新提出要件 | ❌ | **iOS 26.5 SDK 未インストール**（2026-07-18 検証） |

---

## 2. Info.plist / 権限

| キー | 状態 | ソース |
|------|------|--------|
| `NSCameraUsageDescription` | ✅ 追加済（ローカル） | `native/hanakai/ios-config/Info.plist.additions.xml` |
| `NSPhotoLibraryUsageDescription` | ✅ | 同上 |
| `NSPhotoLibraryAddUsageDescription` | ✅ | 同上 |
| `ITSAppUsesNonExemptEncryption` | ✅ `false` | 同上 |
| `CFBundleURLTypes` (`hanakai://`) | ✅ | 同上 |
| `PrivacyInfo.xcprivacy` | ❌ 未作成 | Capacitor 8 + 提出要件で要確認 |
| 通知権限 | — 未使用 | Ver1.1 |

> ⚠️ `native/hanakai/ios/` は `.gitignore` 対象。Archive 前に `Info.plist.additions.xml` を `ios/App/App/Info.plist` へマージすること。

---

## 3. Capacitor

| 項目 | 状態 |
|------|------|
| `@capacitor/camera` | ✅ package.json |
| Web 本番 URL 読み込み | ✅ `hanakai.kranz.design` |
| ローカル dev override | コメントアウト済 |
| `npx cap sync ios` | ⚠️ Archive 前に実行 |

---

## 4. 実機 / Simulator 検証

| 項目 | iPhone 実機 | Simulator | 結果 |
|------|------------|-----------|------|
| インストール | — | — | **未実施** |
| 初回起動・Splash | — | — | **未実施** |
| 登録・規約同意 | — | — | **未実施** |
| ログイン・セッション維持 | — | — | **未実施** |
| カメラ / 写真選択 | — | — | **未実施** |
| 本人確認提出 | — | — | **未実施** |
| イベント参加 | — | — | **未実施** |
| DM / グループ交流 | — | — | **未実施** |
| 外部リンク（terms/privacy） | — | — | **未実施** |
| アカウント削除 | — | — | **未実施** |

**ブロッカー:** Xcode `iOS 26.5 is not installed` — Settings > Components でインストール後に再試行。

---

## 5. Release Build / Archive

| ステップ | 状態 | コマンド / 操作 |
|----------|------|----------------|
| Release Build | ❌ | Product > Build (Release) |
| Archive | ❌ | Product > Archive |
| Validate App | ❌ | Organizer > Validate |
| Upload to App Store Connect | ❌ | Organizer > Distribute |

### Archive 手順（人間操作）

1. `cd native/hanakai && npm ci && npx cap sync ios`
2. `Info.plist.additions.xml` をマージ
3. Xcode で `App.xcworkspace` を開く
4. Scheme: **App**, Destination: **Any iOS Device**
5. **Product → Archive**
6. **Validate App** → 警告解消
7. **Distribute App → App Store Connect → Upload**
8. Connect で Processing 完了を確認（15〜30分）

---

## 6. TestFlight

| 項目 | 状態 |
|------|------|
| ビルドアップロード | ❌ 未実施 |
| Processing 完了 | ❌ |
| 内部テスター追加 | ❌ 人間操作 |
| TestFlight インストール | ❌ |
| 主要導線再確認 | ❌ |

**TestFlight 完了とは報告しない** — 上記すべて PASS 後にのみ完了。

---

## 7. App Store Connect

| 項目 | 指定値 / 状態 |
|------|--------------|
| App Name | **HANAKAI：体験から始まる、新しいつながり。** |
| Subtitle | **趣味や体験を通じて、新しい出会い。** |
| Privacy Policy URL | `https://hanakai.kranz.design/privacy` |
| Support URL | 要設定 |
| Category | Social Networking（要確認） |
| Age Rating | 17+ / 18+（要アンケート） |
| App Privacy | ❌ 未入力 |
| スクリーンショット | ❌ 未準備 |
| Review Notes | `docs/app-review-notes-v1.0.md` 参照 |
| 審査用アカウント | ❌ 要作成 |
| Build 紐づけ | ❌ |
| 暗号化 | `ITSAppUsesNonExemptEncryption = false` → Connect でも No |

---

## 8. 未完了項目（優先順）

1. [ ] Xcode iOS SDK インストール
2. [ ] Info.plist マージ + `cap sync`
3. [ ] Archive / Validate / Upload
4. [ ] TestFlight 内部テスト
5. [ ] App Privacy 入力
6. [ ] スクリーンショット（6.7", 6.5", 5.5"）
7. [ ] 審査用アカウント作成・Connect 登録
8. [ ] Production `REGISTER_DEV_BYPASS_OTP` 削除
