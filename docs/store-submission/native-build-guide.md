# ネイティブビルドガイド（PWA + Capacitor）

HANAKAI Connection Ver1.0 を App Store / Google Play に提出するための Capacitor ラッパービルド手順です。

| 項目 | 内容 |
|------|------|
| 最終更新 | 2026年7月14日 |
| 本番URL | https://hanakai.kranz.design/ |
| アーキテクチャ | PWA（Next.js on Vercel）+ Capacitor WebView |

> **現状:** リポジトリに Capacitor 設定（`capacitor.config.*`、`ios/`、`android/`）は未追加です。本ガイドは初回セットアップ手順として記載しています。

---

## 1. アーキテクチャ概要

```
┌─────────────────────────────────┐
│  App Store / Google Play        │
│  ┌───────────────────────────┐  │
│  │  Capacitor Native Shell   │  │
│  │  ┌─────────────────────┐  │  │
│  │  │  WebView            │  │  │
│  │  │  → hanakai.kranz    │  │  │
│  │  │    .design (本番PWA) │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

- ネイティブ UI は持たず、本番 PWA を WebView で表示
- 認証・データは Supabase（本番環境）
- アプリ内課金・プッシュ通知は Ver1.0 では未実装

---

## 2. 前提条件

### 共通

| 項目 | 要件 |
|------|------|
| Node.js | 20.x 以上 |
| npm | 10.x 以上 |
| 本番 URL 稼働 | https://hanakai.kranz.design/ が安定稼働 |

### iOS

| 項目 | 要件 |
|------|------|
| macOS | 最新版推奨 |
| Xcode | 16 以上 |
| Apple Developer Program | **要人間登録**（年間 $99） |
| 証明書・プロビジョニング | **要人間設定** |

### Android

| 項目 | 要件 |
|------|------|
| Android Studio | 最新安定版 |
| JDK | 17 |
| Google Play Console | **要人間登録**（$25 一回） |
| 署名キー（keystore） | **要人間生成・保管** |

---

## 3. Capacitor 初期セットアップ

### 3.1 パッケージインストール

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npm install @capacitor/splash-screen @capacitor/status-bar
```

### 3.2 Capacitor 初期化

```bash
npx cap init "HANAKAI Connection" design.kranz.hanakai --web-dir=out
```

> ⚠️ **要確認（運営）:** バンドル ID `design.kranz.hanakai` は仮値です。正式な ID を決定してから実行してください。

### 3.3 capacitor.config.ts（推奨設定）

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'design.kranz.hanakai',
  appName: 'HANAKAI Connection',
  webDir: 'out',
  server: {
    // 本番 PWA を直接読み込む（リモート URL モード）
    url: 'https://hanakai.kranz.design/',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#F8F7F3',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#2F6F62',
    },
  },
};

export default config;
```

> **リモート URL モード:** `server.url` を設定すると、WebView はローカル `out/` ではなく本番 URL を読み込みます。Vercel デプロイと常に同期されるため、ネイティブ再ビルドの頻度を下げられます。
>
> ⚠️ **要確認（Apple）:** リモート URL モードは審査で Web アプリとみなされる場合があります。リジェクト時は `out/` への静的エクスポート + ローカルバンドルに切り替えを検討してください。

---

## 4. iOS ビルド手順

### 4.1 プラットフォーム追加

```bash
npx cap add ios
npx cap sync ios
```

### 4.2 Info.plist — 権限説明文（日本語）

以下を `ios/App/App/Info.plist` に追加:

```xml
<key>NSCameraUsageDescription</key>
<string>プロフィール写真やイベント写真を撮影するためにカメラを使用します。</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>プロフィール写真やイベント写真を選択するために写真ライブラリにアクセスします。</string>
```

> ⚠️ **要確認（Apple）:** 位置情報（`NSLocationWhenInUseUsageDescription` 等）は**追加しない**こと。使用しない権限の記載も審査で問題になる場合があります。

### 4.3 Xcode での作業（要人間）

1. `npx cap open ios` で Xcode を開く
2. **Signing & Capabilities** で Team・Bundle Identifier を設定
3. App Icon（1024×1024）を `Assets.xcassets` に設定
4. Splash Screen を設定
5. **Product → Archive** でビルド
6. **Organizer → Distribute App → App Store Connect** でアップロード

> ⚠️ **要人間対応:** 証明書・プロビジョニングプロファイルの作成は Apple Developer Portal で行います。

---

## 5. Android ビルド手順

### 5.1 プラットフォーム追加

```bash
npx cap add android
npx cap sync android
```

### 5.2 AndroidManifest.xml — 権限

必要最小限の権限のみ:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```

> 位置情報権限（`ACCESS_FINE_LOCATION` 等）は**追加しない**。

### 5.3 署名キー（要人間）

```bash
keytool -genkey -v -keystore hanakai-release.keystore \
  -alias hanakai -keyalg RSA -keysize 2048 -validity 10000
```

> ⚠️ **要人間対応:**
> - keystore ファイルとパスワードは安全に保管（紛失するとアップデート不可）
> - `android/app/build.gradle` に signingConfig を設定

### 5.4 AAB ビルド

```bash
cd android
./gradlew bundleRelease
```

出力: `android/app/build/outputs/bundle/release/app-release.aab`

Google Play Console にアップロード。

> ⚠️ **要人間対応:** Google Play Console でアプリ作成・AAB アップロード・段階的公開の設定を行います。

---

## 6. ネイティブブリッジ（将来拡張）

Ver1.0 では不要ですが、将来のネイティブ機能追加時の参考:

| 機能 | Capacitor プラグイン |
|------|---------------------|
| プッシュ通知 | `@capacitor/push-notifications` |
| カメラ | `@capacitor/camera` |
| ファイル | `@capacitor/filesystem` |
| ディープリンク | `@capacitor/app` + Universal Links / App Links |

---

## 7. ビルドバージョン管理

| フィールド | iOS | Android |
|------------|-----|---------|
| バージョン名 | `1.0.0`（CFBundleShortVersionString） | `1.0.0`（versionName） |
| ビルド番号 | `1`（CFBundleVersion） | `1`（versionCode） |

バージョンアップ時:

1. `capacitor.config.ts` の確認
2. iOS: Xcode で Version / Build を更新
3. Android: `build.gradle` の versionCode / versionName を更新
4. `npx cap sync`
5. 再ビルド・再提出

---

## 8. トラブルシューティング

| 問題 | 対処 |
|------|------|
| WebView が白画面 | `server.url` の URL 到達性を確認。SSL 証明書の有効性を確認 |
| 認証コールバック失敗 | Universal Links / Custom URL Scheme の設定を確認 |
| カメラが動かない | Info.plist / AndroidManifest の権限説明文を確認 |
| CORS エラー | 本番 URL モードでは通常発生しない。ローカルバンドル時は API オリジンを確認 |
| App Store リジェクト（4.2 Minimum Functionality） | リモート URL モードの場合、ネイティブ機能の追加またはローカルバンドル化を検討 |

---

## 9. 人間対応が必要な作業一覧

| # | 作業 | 担当 | ツール |
|---|------|------|--------|
| 1 | Apple Developer Program 登録 | 人間 | developer.apple.com |
| 2 | Google Play Console 登録 | 人間 | play.google.com/console |
| 3 | バンドル ID / パッケージ名の正式決定 | 人間 | — |
| 4 | iOS 証明書・プロビジョニング作成 | 人間 | Apple Developer Portal |
| 5 | Android 署名キー生成・保管 | 人間 | keytool |
| 6 | Xcode Archive & Upload | 人間 | Xcode |
| 7 | Google Play AAB アップロード | 人間 | Play Console |
| 8 | App Store Connect メタデータ入力 | 人間 | App Store Connect |
| 9 | ストア審査提出 | 人間 | 各 Console |
| 10 | 審査リジェクト対応 | 人間 | — |

---

## 10. 関連ドキュメント

| ファイル | 内容 |
|----------|------|
| `store-metadata.md` | メタデータ一覧 |
| `release-checklist.md` | リリース前チェックリスト |
| `review-notes.md` | 審査用メモ |
| `screenshot-plan.md` | スクリーンショット計画 |
