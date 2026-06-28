-- ============================================================
-- HANAKAI Connection — Event images (ADDITIVE)
-- Scope: hanakai_events に image_urls を追加し、event-images Storage を新設。
-- 既存 Nurse Match テーブル / Storage には一切触れない。
-- ============================================================

-- ---------- hanakai_events: イベント写真URL ----------
alter table public.hanakai_events
  add column if not exists image_urls text[] not null default '{}';

-- ---------- Storage bucket: event-images（公開・読み取り自由） ----------
insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

-- ---------- Storage RLS（event-images バケットのみ対象） ----------
-- 読み取りは公開。アップロードは認証済み（匿名サインイン含む）に限定。
do $$ begin
  create policy "hk_event_images_read" on storage.objects
    for select using (bucket_id = 'event-images');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hk_event_images_insert" on storage.objects
    for insert with check (
      bucket_id = 'event-images' and auth.role() = 'authenticated'
    );
exception when duplicate_object then null; end $$;

-- NOTE:
--  * additive マイグレーション。既存ポリシー・バケットには影響しない。
--  * 将来「イベント終了後に参加者が写真追加」へ拡張する場合も、
--    同バケット + image_urls 追記 or 別テーブルで対応可能な設計。
