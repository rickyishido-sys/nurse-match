-- ============================================================
-- HANAKAI Connection — Bloom Profile Lite (ADDITIVE)
-- SNS URL 保存・MBTI・年齢層。破壊的変更なし。
-- ============================================================

alter table public.hanakai_members
  add column if not exists age_band text,
  add column if not exists mbti_type text;

create table if not exists public.hanakai_member_social_links (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.hanakai_members(id) on delete cascade,
  platform    text not null,
  url         text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (member_id, platform)
);

create index if not exists idx_hanakai_social_links_member
  on public.hanakai_member_social_links(member_id);

drop trigger if exists trg_hanakai_social_links_touch on public.hanakai_member_social_links;
create trigger trg_hanakai_social_links_touch
  before update on public.hanakai_member_social_links
  for each row execute function public.hanakai_touch_updated_at();

alter table public.hanakai_member_social_links enable row level security;

do $$ begin
  create policy "hk_social_read" on public.hanakai_member_social_links
    for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hk_social_self_insert" on public.hanakai_member_social_links
    for insert with check (
      member_id in (
        select id from public.hanakai_members where auth_user_id = auth.uid()
      )
    );
  create policy "hk_social_self_update" on public.hanakai_member_social_links
    for update using (
      member_id in (
        select id from public.hanakai_members where auth_user_id = auth.uid()
      )
    );
  create policy "hk_social_self_delete" on public.hanakai_member_social_links
    for delete using (
      member_id in (
        select id from public.hanakai_members where auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;
