# Build v1.0(1) 対応デバイス判定

| 項目 | 内容 |
|------|------|
| 対象 | App Store Connect アップロード済み **Version 1.0 / Build 1** |
| 申請方針 | **iPhone 専用** |
| 判定日 | 2026-08-11 |
| 判定結果 | **未確定（A/B を断定できない）— 人間による ASC 目視が必要** |

---

## 結論

**A（iPhone専用） / B（iPhone + iPad Universal）のどちらとも、現時点では確定できません。**

アップロード済みバイナリそのもの・Archive / Export ログ・App Store Connect API へのアクセスが、この Cloud Agent 環境にありません。推測で A または B に振りません。

スクリーンショット撮影・加工・ASC アップロードは、**A/B 確定後まで開始しない**。

---

## 調査した証拠

| # | 確認先 | 結果 | A/B への意味 |
|---|--------|------|--------------|
| 1 | Capacitor 8 `npx cap add ios` 生成直後の `project.pbxproj` | `TARGETED_DEVICE_FAMILY = "1,2"` / `MARKETING_VERSION = 1.0` / `CURRENT_PROJECT_VERSION = 1` | **生成デフォルトは B**。ただし「アップロード済みバイナリ」そのものではない（本 Agent が再生成した雛形） |
| 2 | 生成 `Info.plist` | `UISupportedInterfaceOrientations~ipad` キーあり（Capacitor 既定） | Universal 向け雛形の特徴。Archive 時に変更した記録なし |
| 3 | 追跡済み `ios-config` / `apply-ios-plist.mjs`（過去コミット `94f8aae`） | カメラ・写真・暗号化・URL Scheme のみ。**device family は未設定** | Archive 前マージでも `TARGETED_DEVICE_FAMILY` は変わらない |
| 4 | `docs/ios-release-checklist-v1.0.md`（2026-07-18、後に削除） | Supported Devices 期待値は「iPhone」だが状態は **⚠️ 人間確認**。当時 Archive/Upload は **❌ 未実施** | **方針は A 寄り**だが、設定済み証明にはならない |
| 5 | 現行リポジトリの `ios/` | `.gitignore` 対象。提出時 Archive 設定は未コミット | 提出時の実値を再現不可 |
| 6 | Archive / Export / Organizer ログ | リポジトリ・環境内に **存在しない** | 裏取り不可 |
| 7 | App Store Connect API / 認証情報 | 環境シークレット未設定 | ASC 上の Build メタデータを API 取得不可 |
| 8 | GitHub PR / 過去エージェント記録 | Build デバイス確定の記録なし | 追加証拠なし |

### 読み取り（推測ではない範囲）

- **意図（申請方針・旧チェックリスト）:** iPhone 専用（A）
- **ツール既定（Capacitor 生成値・plist マージ範囲）:** 変更しなければ `"1,2"`（B）
- **アップロード済み v1.0(1) の実値:** **不明 → ASC または提出 Mac の Archive でのみ確定可能**

---

## 人間確認手順（iPhone の App Store Connect）

App Store Connect アプリ（iPhone）で次を実施し、結果を **A または B** で返信してください。

### 手順 A — Build Metadata（最優先）

1. **App Store Connect** アプリを開く  
2. **My Apps** → **華会 HANAKAI / HANAKAI Connection**（該当アプリ）  
3. 上部で **iOS App** を選択  
4. **TestFlight** を開く  
5. Version **1.0** を展開 → Build **1**（表記: `1.0 (1)`）をタップ  
6. **Build Metadata（ビルドメタデータ）** を開く  
7. 次を確認してメモ:
   - **Supported Devices / 対応デバイス**（iPhone only / iPhone and iPad 等）
   - **App File Sizes（アプリファイルサイズ）** 内の variant 一覧に **iPad 向け行があるか**
     - iPad 行がある → **B の可能性が高い**
     - iPhone のみ → **A の可能性が高い**  
   - ※「Universal」という variant 名は、古い配信経路用の総称でも使われるため、**単独では B 確定に使わない**。iPad デバイス行の有無を優先。

### 手順 B — 価格および配信可否（併用）

1. 同アプリ → **App Store**（またはアプリ情報）  
2. **価格および配信可否 / Pricing and Availability**  
3. **iPhone / iPad** の配信チェック状態を確認  
4. ここは「配信設定」であり、バイナリの `TARGETED_DEVICE_FAMILY` と一致しない場合がある  
5. **Build Metadata の結果を正**とし、配信設定は参考として併記

### 手順 C — 提出した Mac がある場合（最も確実な裏取り）

1. Xcode → **Window → Organizer**  
2. アップロード済み Archive（Version 1.0 / Build 1）を選択  
3. または Archive 元プロジェクト:
   - `ios/App/App.xcodeproj` を開く  
   - Target **App** → **General** → **Supported Destinations / Devices**  
   - または Build Settings → `TARGETED_DEVICE_FAMILY`
4. 判定:
   - `1` または Devices = **iPhone** のみ → **A**
   - `1,2` または **iPhone + iPad** → **B**

### 返信テンプレ

```
Build v1.0(1) 判定:
A. iPhone専用（TARGETED_DEVICE_FAMILY=1）
または
B. iPhone + iPad Universal（1,2）

確認場所:（TestFlight Build Metadata / Xcode Organizer / 両方）
メモ:（例: App File Sizes に iPad 行あり / Devices = iPhone のみ）
```

---

## 判定後の分岐

| 結果 | スクリーンショット方針 |
|------|------------------------|
| **A. iPhone専用** | iPhone 6.9" Display（主成果物 **1320×2868**、互換 1290×2796）の6枚のみで進める |
| **B. Universal** | 上記に加え **iPad 13"**（2064×2752 または 2048×2732）も必須。または次 Build で `TARGETED_DEVICE_FAMILY=1` に直して再アップロードしてから iPhone のみで進める |

方針が iPhone 専用で、確認結果が **B** の場合は、スクショ作成より先に **iPhone専用への再ビルド**を検討してください。

---

## この段階でやらないこと

- スクリーンショット撮影
- キャプション加工
- App Store Connect へのスクショアップロード
- 審査用データの変更・削除
- 実課金・参加申請送信
