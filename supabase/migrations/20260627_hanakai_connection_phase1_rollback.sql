-- ============================================================
-- ROLLBACK: HANAKAI Connection Phase 1
-- 新設テーブルのみを破棄する。既存 Nurse Match / auth.users には影響なし。
-- 実行前に必要なら hanakai_* を CSV 退避すること。
-- ============================================================
drop table if exists public.hanakai_event_applications cascade;
drop table if exists public.hanakai_events             cascade;
drop table if exists public.hanakai_members            cascade;
drop function if exists public.hanakai_touch_updated_at();
