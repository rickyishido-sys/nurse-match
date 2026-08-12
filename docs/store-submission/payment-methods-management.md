# お支払い方法管理（実装メモ）

| 項目 | 内容 |
|------|------|
| ブランチ | `cursor/payment-methods-management-324f` |
| 状態 | **コード + migration 作成済み。Production 未適用** |
| ベース | `feature/hanakai-square-payments` |

## ユーザー導線

- プロフィール → **お支払い方法** → `/account/payment-methods`
- ヘッダーメニューにも「お支払い方法」
- 旧 `/my-profile/payment-methods` は canonical へリダイレクト

## Migration（未適用）

- `supabase/migrations/20260812_hanakai_payment_method_management.sql`
- `payment_method_id` on `hanakai_event_applications`
- unique index: 1 member × env × active default
- RPC `hanakai_set_default_payment_method`

Production 適用は明示承認後のみ。
