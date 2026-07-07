-- ============================================================
-- HANAKAI Connection — Bloom Profile Phase 4 (ADDITIVE)
-- Timeline / Memories / Version History / AI Reflection
-- ============================================================

-- AI Reflection + Phase4 公開設定
alter table public.hanakai_bloom_profiles
  add column if not exists ai_reflection text;

alter table public.hanakai_bloom_profiles
  add column if not exists show_timeline boolean not null default true;

alter table public.hanakai_bloom_profiles
  add column if not exists show_memories boolean not null default false;

alter table public.hanakai_bloom_profiles
  add column if not exists show_reflection boolean not null default true;

-- ---------- Bloom Timeline ----------
create table if not exists public.hanakai_bloom_timeline (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.hanakai_members(id) on delete cascade,
  type        text not null,
  title       text not null,
  description text,
  visibility  text not null default 'public',
  event_id    uuid references public.hanakai_events(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_hanakai_bloom_timeline_member
  on public.hanakai_bloom_timeline(member_id, created_at desc);

-- ---------- Bloom Memories ----------
create table if not exists public.hanakai_bloom_memories (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.hanakai_members(id) on delete cascade,
  event_id    uuid references public.hanakai_events(id) on delete set null,
  memory      text not null,
  visibility  text not null default 'private',
  created_at  timestamptz not null default now()
);

create index if not exists idx_hanakai_bloom_memories_member
  on public.hanakai_bloom_memories(member_id, created_at desc);

create unique index if not exists idx_hanakai_bloom_memories_member_event
  on public.hanakai_bloom_memories(member_id, event_id)
  where event_id is not null;

-- ---------- Bloom Version History ----------
create table if not exists public.hanakai_bloom_versions (
  id                    uuid primary key default gen_random_uuid(),
  member_id             uuid not null references public.hanakai_members(id) on delete cascade,
  summary               text,
  summary_title         text,
  connection_style      text,
  conversation_starters jsonb not null default '[]'::jsonb,
  ai_tags               text[] not null default '{}',
  created_at            timestamptz not null default now()
);

create index if not exists idx_hanakai_bloom_versions_member
  on public.hanakai_bloom_versions(member_id, created_at desc);

alter table public.hanakai_bloom_timeline enable row level security;
alter table public.hanakai_bloom_memories enable row level security;
alter table public.hanakai_bloom_versions enable row level security;

do $$ begin
  create policy "hk_bloom_timeline_read" on public.hanakai_bloom_timeline
    for select using (true);
  create policy "hk_bloom_timeline_self_insert" on public.hanakai_bloom_timeline
    for insert with check (
      member_id in (select id from public.hanakai_members where auth_user_id = auth.uid())
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hk_bloom_memories_read" on public.hanakai_bloom_memories
    for select using (true);
  create policy "hk_bloom_memories_self_insert" on public.hanakai_bloom_memories
    for insert with check (
      member_id in (select id from public.hanakai_members where auth_user_id = auth.uid())
    );
  create policy "hk_bloom_memories_self_update" on public.hanakai_bloom_memories
    for update using (
      member_id in (select id from public.hanakai_members where auth_user_id = auth.uid())
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hk_bloom_versions_read" on public.hanakai_bloom_versions
    for select using (true);
  create policy "hk_bloom_versions_self_insert" on public.hanakai_bloom_versions
    for insert with check (
      member_id in (select id from public.hanakai_members where auth_user_id = auth.uid())
    );
exception when duplicate_object then null; end $$;
