# HANAKAI Ver1.0 Work State Snapshot

| 項目 | 値 |
|------|-----|
| 記録日時 | 2026-07-18T00:30+09:00 |
| ブランチ | `hanakai-v10-safety` |
| HEAD commit | `0c829e0ff52d39ba2fed43f8d99f8a11565504bf` — Add HANAKAI Ver1.0 final release audit report. |
| 対象 PR | https://github.com/rickyishido-sys/nurse-match/pull/1（未マージ） |
| Supabase project ref | `regjgwrugiwbmxcsxuex` |
| Production URL | https://hanakai.kranz.design/ |
| Preview URL（push前） | branch `hanakai-v10-safety` 最新 Preview（push 後に更新） |

## 未コミット差分（12 files, +423/-55）

- `src/app/register/page.tsx`
- `src/components/connection/delete-account-form.tsx`
- `src/components/connection/onboarding/onboarding-flow.tsx`
- `src/components/connection/onboarding/registration-steps.tsx`
- `src/lib/actions.ts`
- `src/lib/connection/account-deletion.ts`
- `src/lib/connection/actions.ts`
- `src/lib/connection/data.ts`
- `src/lib/connection/onboarding-progress.ts`
- `src/lib/connection/registration-status.ts`
- `src/lib/connection/repo-supabase.ts`
- `src/lib/connection/types.ts`

## 未追跡（作業関連）

- `docs/release-audit-v1.0-final.md` ✅
- `docs/ios-release-checklist-v1.0.md` ✅
- `docs/app-review-notes-v1.0.md` ✅
- `supabase/migrations/20260718_hanakai_legal_consent_rls.sql` ✅
- `native/hanakai/ios-config/Info.plist.additions.xml` ✅
- `src/lib/connection/legal-consent.ts`

## 未適用 migration（開始時点）

- `20260718_hanakai_legal_consent_rls.sql`
