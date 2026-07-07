-- ============================================================
-- HANAKAI Connection — Bloom Profile Lite Phase 2 (ADDITIVE)
-- SNS公開設定・AI自己紹介メタデータ
-- ============================================================

alter table public.hanakai_member_social_links
  add column if not exists is_visible_on_profile boolean not null default false;

alter table public.hanakai_members
  add column if not exists introduction_ai_generated boolean not null default false,
  add column if not exists introduction_generated_at timestamptz;
