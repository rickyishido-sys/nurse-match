-- ============================================================
-- HANAKAI Connection — Safety reports (ADDITIVE)
-- ユーザー通報・イベント通報・プロフィール通報
-- ============================================================

alter table public.hanakai_reports
  add column if not exists target_member_id uuid references public.hanakai_members(id) on delete set null;

alter table public.hanakai_reports
  add column if not exists target_event_id uuid references public.hanakai_events(id) on delete set null;

alter table public.hanakai_reports
  add column if not exists category text;

alter table public.hanakai_reports
  add column if not exists description text;

alter table public.hanakai_reports
  add column if not exists admin_note text;

-- 旧ステータス open を new に正規化
update public.hanakai_reports set status = 'new' where status = 'open';

create index if not exists idx_hanakai_reports_target_member
  on public.hanakai_reports(target_member_id);

create index if not exists idx_hanakai_reports_target_event
  on public.hanakai_reports(target_event_id);

-- insert はログイン中ユーザーのみ（reporter_member_id は自分の member_id）
drop policy if exists "hk_reports_reporter_insert" on public.hanakai_reports;
do $$ begin
  create policy "hk_reports_reporter_insert" on public.hanakai_reports
    for insert with check (
      reporter_member_id in (
        select id from public.hanakai_members where auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;
