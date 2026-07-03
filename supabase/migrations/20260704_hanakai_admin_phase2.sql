-- ============================================================
-- HANAKAI Connection — Admin Phase 2 (ADDITIVE)
-- 参加申請の運営処理メタデータ + 通報 inbox
-- ============================================================

-- 参加申請: 運営/主催者の処理者・メモ（既存行はそのまま）
alter table public.hanakai_event_applications
  add column if not exists decided_by_member_id uuid references public.hanakai_members(id) on delete set null;

alter table public.hanakai_event_applications
  add column if not exists decision_note text;

create index if not exists idx_hanakai_apps_decided_by
  on public.hanakai_event_applications(decided_by_member_id);

-- ---------- 通報 inbox ----------
create table if not exists public.hanakai_reports (
  id                    uuid primary key default gen_random_uuid(),
  reporter_member_id    uuid references public.hanakai_members(id) on delete set null,
  target_type           text not null default 'group_post',
  target_id             text not null,
  reason                text not null default '',
  detail                text not null default '',
  status                text not null default 'open',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  resolved_at           timestamptz,
  resolved_by_member_id uuid references public.hanakai_members(id) on delete set null
);

create index if not exists idx_hanakai_reports_status on public.hanakai_reports(status, created_at desc);
create index if not exists idx_hanakai_reports_target on public.hanakai_reports(target_type, target_id);

drop trigger if exists trg_hanakai_reports_touch on public.hanakai_reports;
create trigger trg_hanakai_reports_touch
  before update on public.hanakai_reports
  for each row execute function public.hanakai_touch_updated_at();

alter table public.hanakai_reports enable row level security;

-- 通報者本人のみ insert（読取・更新は service_role / 運営管理 API）
do $$ begin
  create policy "hk_reports_reporter_insert" on public.hanakai_reports
    for insert with check (
      reporter_member_id is null
      or reporter_member_id in (
        select id from public.hanakai_members where auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;
