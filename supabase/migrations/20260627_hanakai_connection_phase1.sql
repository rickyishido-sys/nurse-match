-- ============================================================
-- HANAKAI Connection — Phase 1 schema (ADDITIVE / PREFIXED)
-- Scope: profile / event / event application のみ。
-- 既存 Nurse Match テーブル・旧 supabase/hanakai-schema.sql には一切触れない。
-- すべて `hanakai_` プレフィックスで新設するため無名衝突なし。
-- Identity は Supabase Auth (auth.users) を真実とし、匿名サインインを許容する。
-- ============================================================

-- ---------- 共通: updated_at 自動更新 ----------
create or replace function public.hanakai_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- members（プロフィール） ----------
create table if not exists public.hanakai_members (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid unique references auth.users(id) on delete cascade,
  nickname        text not null default '',
  age             int,
  gender          text not null default 'other',          -- female | male | other
  area            text not null default '',
  occupation      text not null default '',
  bio             text not null default '',
  avatar_url      text not null default '',
  purposes        text[] not null default '{}',            -- ConnectionPurpose[]
  interest_tags   text[] not null default '{}',            -- InterestTag[]
  life_phase      text not null default 'other',           -- LifePhase
  values          jsonb not null default '{}'::jsonb,       -- ProfileValues (valueTags 含む)
  personality     jsonb,                                    -- PersonalityProfile | null
  host_badges     text[] not null default '{}',            -- HostBadge[] (UIのみ)
  -- 本人確認 / 安全確認（型: MemberTrustVerificationFields）
  trust_verification_status    text not null default 'pending',
  identity_verified            boolean not null default false,
  identity_verification_date   timestamptz,
  trust_verification_date      timestamptz,
  trust_notes                  text,
  safety_flags                 text[] not null default '{}',
  verification_source          text not null default 'none',
  identity_verification_method text not null default 'none',
  external_verification_ref    text,
  document_upload_status       text not null default 'none',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_hanakai_members_auth on public.hanakai_members(auth_user_id);

-- ---------- events（運営 / ユーザー作成 両方） ----------
create table if not exists public.hanakai_events (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  category        text not null default 'other',           -- ConnectionEventCategory
  start_at        timestamptz not null,
  area            text not null default '',
  venue           text not null default '',
  capacity        int not null default 6,
  host_member_id  uuid references public.hanakai_members(id) on delete set null, -- null = 運営
  host_name       text not null default 'HANAKAI Connection 運営',
  conditions      text not null default '',
  description     text not null default '',
  cover_url       text not null default '',
  status          text not null default 'open',            -- ConnectionEventStatus
  fee             int not null default 0,
  approval_mode   text not null default 'host_approval',   -- host_approval | auto
  is_user_created boolean not null default false,
  is_past         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_hanakai_events_start on public.hanakai_events(start_at);
create index if not exists idx_hanakai_events_host  on public.hanakai_events(host_member_id);

-- ---------- event applications（= 参加者。confirmed が確定者） ----------
create table if not exists public.hanakai_event_applications (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.hanakai_events(id) on delete cascade,
  member_id   uuid not null references public.hanakai_members(id) on delete cascade,
  status      text not null default 'pending',             -- pending | confirmed | rejected
  reason      text,
  applied_at  timestamptz not null default now(),
  decided_at  timestamptz,
  unique (event_id, member_id)
);
create index if not exists idx_hanakai_apps_event  on public.hanakai_event_applications(event_id);
create index if not exists idx_hanakai_apps_member on public.hanakai_event_applications(member_id);

-- ---------- updated_at triggers ----------
drop trigger if exists trg_hanakai_members_touch on public.hanakai_members;
create trigger trg_hanakai_members_touch
  before update on public.hanakai_members
  for each row execute function public.hanakai_touch_updated_at();

drop trigger if exists trg_hanakai_events_touch on public.hanakai_events;
create trigger trg_hanakai_events_touch
  before update on public.hanakai_events
  for each row execute function public.hanakai_touch_updated_at();

-- ============================================================
-- RLS（新テーブルのみ。既存ポリシーには一切触れない）
-- ============================================================
alter table public.hanakai_members            enable row level security;
alter table public.hanakai_events             enable row level security;
alter table public.hanakai_event_applications enable row level security;

-- 閲覧は公開（browse-before-join 体験を維持）
do $$ begin
  create policy "hk_members_read" on public.hanakai_members
    for select using (true);
  create policy "hk_events_read" on public.hanakai_events
    for select using (true);
  create policy "hk_apps_read" on public.hanakai_event_applications
    for select using (true);
exception when duplicate_object then null; end $$;

-- members: 自分の行のみ insert / update（匿名サインインの uid と一致）
do $$ begin
  create policy "hk_members_self_insert" on public.hanakai_members
    for insert with check (auth.uid() = auth_user_id);
  create policy "hk_members_self_update" on public.hanakai_members
    for update using (auth.uid() = auth_user_id);
exception when duplicate_object then null; end $$;

-- events: 主催メンバー本人のみ insert / update
do $$ begin
  create policy "hk_events_host_insert" on public.hanakai_events
    for insert with check (
      host_member_id in (
        select id from public.hanakai_members where auth_user_id = auth.uid()
      )
    );
  create policy "hk_events_host_update" on public.hanakai_events
    for update using (
      host_member_id in (
        select id from public.hanakai_members where auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- applications: 申請者本人が insert / イベント主催者が update（承認・却下）
do $$ begin
  create policy "hk_apps_self_insert" on public.hanakai_event_applications
    for insert with check (
      member_id in (
        select id from public.hanakai_members where auth_user_id = auth.uid()
      )
    );
  create policy "hk_apps_host_update" on public.hanakai_event_applications
    for update using (
      event_id in (
        select e.id
        from public.hanakai_events e
        join public.hanakai_members m on m.id = e.host_member_id
        where m.auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- NOTE:
--  * 運営主催イベントの投入・運営/管理オペレーションは service_role
--    (createAdminSupabaseClient) で実行し RLS をバイパスする。
--  * 本マイグレーションは additive。ロールバックは drop_phase1 を参照。
