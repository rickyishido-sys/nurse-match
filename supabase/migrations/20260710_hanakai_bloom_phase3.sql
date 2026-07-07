-- ============================================================
-- HANAKAI Connection — Bloom Profile Phase 3 (ADDITIVE)
-- AI統合プロフィール（評価システムではない）
-- ============================================================

create table if not exists public.hanakai_bloom_profiles (
  member_id                 uuid primary key references public.hanakai_members(id) on delete cascade,
  ai_introduction           text,
  bloom_summary_title       text,
  bloom_summary             text,
  conversation_starters     jsonb not null default '[]'::jsonb,
  connection_style          text,
  talk_topics               jsonb not null default '[]'::jsonb,
  ai_tags                   text[] not null default '{}',
  show_ai_intro             boolean not null default false,
  show_bloom_summary        boolean not null default true,
  show_conversation_starters boolean not null default true,
  show_bloom_tags           boolean not null default false,
  show_connection_style     boolean not null default true,
  generated_at              timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

drop trigger if exists trg_hanakai_bloom_profiles_touch on public.hanakai_bloom_profiles;
create trigger trg_hanakai_bloom_profiles_touch
  before update on public.hanakai_bloom_profiles
  for each row execute function public.hanakai_touch_updated_at();

alter table public.hanakai_bloom_profiles enable row level security;

do $$ begin
  create policy "hk_bloom_read" on public.hanakai_bloom_profiles
    for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hk_bloom_self_insert" on public.hanakai_bloom_profiles
    for insert with check (
      member_id in (
        select id from public.hanakai_members where auth_user_id = auth.uid()
      )
    );
  create policy "hk_bloom_self_update" on public.hanakai_bloom_profiles
    for update using (
      member_id in (
        select id from public.hanakai_members where auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;
