-- ============================================================
-- HANAKAI / 花会  Supabase schema (MVP)
-- リアル花会 → デジタルコミュニティ → リアル花会 の循環を支える最小スキーマ。
-- Supabase Auth (auth.users) を ID の真実とし、public.profiles で拡張する。
-- 既存の nurse-match テーブルは廃止予定。新規プロジェクト or 別schemaで適用可。
-- ============================================================

-- ---------- enums ----------
do $$ begin
  create type hanakai_instructor_stage as enum
    ('participant','regular','support','candidate','certified','area_lead');
exception when duplicate_object then null; end $$;

do $$ begin
  create type hanakai_connection_kind as enum ('follow','curious','cheer','meet');
exception when duplicate_object then null; end $$;

do $$ begin
  create type hanakai_support_category as enum ('instructor','area','shop','learn','spread');
exception when duplicate_object then null; end $$;

do $$ begin
  create type hanakai_live_category as enum ('hanakai','challenge','area_launch','dream');
exception when duplicate_object then null; end $$;

do $$ begin
  create type hanakai_event_status as enum ('open','almost_full','full','closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type hanakai_role as enum ('member','admin');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null,
  nickname text not null,
  age int,
  gender text default 'unspecified',          -- female / male / other / unspecified
  area text default '',
  bio text default '',
  interest_tags text[] default '{}',
  purpose text default '',                     -- 花会参加目的
  avatar_url text default '',
  instructor_stage hanakai_instructor_stage not null default 'participant',
  role hanakai_role not null default 'member',
  is_certified boolean not null default false,
  joined_event_count int not null default 0,
  post_count int not null default 0,
  follower_count int not null default 0,
  cheer_points int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- events (リアル花会) ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_at timestamptz not null,
  area text not null,
  venue text not null,
  capacity int not null default 0,
  reserved_count int not null default 0,
  fee int not null default 0,
  description text default '',
  host_id uuid references public.profiles(id) on delete set null,
  has_alcohol boolean not null default false,
  cover_url text default '',
  status hanakai_event_status not null default 'open',
  recommended boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.event_participants (
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- ---------- posts (作品投稿) ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  title text not null,
  body text default '',
  flowers_used text[] default '{}',
  event_id uuid references public.events(id) on delete set null,
  tags text[] default '{}',
  like_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------- connections (つながり: フォロー/気になる/応援したい/会ってみたい) ----------
create table if not exists public.connections (
  from_user_id uuid references public.profiles(id) on delete cascade,
  to_user_id uuid references public.profiles(id) on delete cascade,
  kind hanakai_connection_kind not null,
  created_at timestamptz not null default now(),
  primary key (from_user_id, to_user_id, kind),
  check (from_user_id <> to_user_id)
);

-- ---------- messages (DM) ----------
create table if not exists public.dm_threads (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a, user_b)
);

create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.dm_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------- lives (配信土台) ----------
create table if not exists public.lives (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category hanakai_live_category not null default 'hanakai',
  host_id uuid references public.profiles(id) on delete set null,
  scheduled_at timestamptz,
  is_live_now boolean not null default false,
  viewer_count int not null default 0,
  cheer_total int not null default 0,
  cover_url text default '',
  description text default '',
  created_at timestamptz not null default now()
);

-- ---------- support projects (応援/投げ花) ----------
create table if not exists public.support_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category hanakai_support_category not null,
  summary text default '',
  story text default '',
  goal_amount int not null default 0,
  raised_amount int not null default 0,
  supporter_count int not null default 0,
  cover_url text default '',
  payout_rate numeric(3,2) not null default 0.80,  -- 本人に届く割合
  created_at timestamptz not null default now()
);

create table if not exists public.cheers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.support_projects(id) on delete cascade,
  live_id uuid references public.lives(id) on delete cascade,
  supporter_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null check (amount > 0),
  created_at timestamptz not null default now()
);

-- ---------- instructor applications (講師認定) ----------
create table if not exists public.instructor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  current_stage hanakai_instructor_stage not null default 'candidate',
  exam_score int,
  review_score numeric(3,2),
  status text not null default 'pending',  -- pending / approved / rejected
  reviewed_by uuid references public.profiles(id) on delete set null,
  note text default '',
  created_at timestamptz not null default now()
);

-- ---------- reports / notices ----------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type text not null,  -- post / user / comment / event
  target_id uuid,
  reason text default '',
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text default '',
  published_at timestamptz not null default now()
);

-- ---------- indexes ----------
create index if not exists idx_posts_created on public.posts (created_at desc);
create index if not exists idx_posts_author on public.posts (author_id);
create index if not exists idx_events_start on public.events (start_at);
create index if not exists idx_comments_post on public.post_comments (post_id);
create index if not exists idx_cheers_project on public.cheers (project_id);

-- ---------- auto-create profile on signup ----------
create or replace function public.handle_new_hanakai_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, handle, nickname)
  values (
    new.id,
    'u_' || substr(new.id::text, 1, 8),
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created_hanakai on auth.users;
create trigger on_auth_user_created_hanakai
  after insert on auth.users
  for each row execute function public.handle_new_hanakai_user();

-- ---------- RLS ----------
alter table public.profiles            enable row level security;
alter table public.events              enable row level security;
alter table public.event_participants  enable row level security;
alter table public.posts               enable row level security;
alter table public.post_likes          enable row level security;
alter table public.post_comments       enable row level security;
alter table public.connections         enable row level security;
alter table public.dm_threads          enable row level security;
alter table public.dm_messages         enable row level security;
alter table public.lives               enable row level security;
alter table public.support_projects    enable row level security;
alter table public.cheers              enable row level security;
alter table public.instructor_applications enable row level security;
alter table public.reports             enable row level security;
alter table public.notices             enable row level security;

-- public read for community content
do $$ begin
  create policy "public read profiles" on public.profiles for select using (true);
  create policy "public read events" on public.events for select using (true);
  create policy "public read participants" on public.event_participants for select using (true);
  create policy "public read posts" on public.posts for select using (true);
  create policy "public read post_likes" on public.post_likes for select using (true);
  create policy "public read comments" on public.post_comments for select using (true);
  create policy "public read connections" on public.connections for select using (true);
  create policy "public read lives" on public.lives for select using (true);
  create policy "public read support" on public.support_projects for select using (true);
  create policy "public read cheers" on public.cheers for select using (true);
  create policy "public read notices" on public.notices for select using (true);
exception when duplicate_object then null; end $$;

-- owner writes
do $$ begin
  create policy "own profile upsert" on public.profiles for update using (auth.uid() = id);
  create policy "own posts insert" on public.posts for insert with check (auth.uid() = author_id);
  create policy "own posts update" on public.posts for update using (auth.uid() = author_id);
  create policy "own posts delete" on public.posts for delete using (auth.uid() = author_id);
  create policy "own comments insert" on public.post_comments for insert with check (auth.uid() = author_id);
  create policy "own likes insert" on public.post_likes for insert with check (auth.uid() = user_id);
  create policy "own likes delete" on public.post_likes for delete using (auth.uid() = user_id);
  create policy "own connections insert" on public.connections for insert with check (auth.uid() = from_user_id);
  create policy "own connections delete" on public.connections for delete using (auth.uid() = from_user_id);
  create policy "own participation insert" on public.event_participants for insert with check (auth.uid() = user_id);
  create policy "own participation delete" on public.event_participants for delete using (auth.uid() = user_id);
  create policy "own cheers insert" on public.cheers for insert with check (auth.uid() = supporter_id);
  create policy "own support insert" on public.support_projects for insert with check (auth.uid() = owner_id);
  create policy "own support update" on public.support_projects for update using (auth.uid() = owner_id);
  create policy "own instructor application" on public.instructor_applications for insert with check (auth.uid() = user_id);
  create policy "own report insert" on public.reports for insert with check (auth.uid() = reporter_id);
exception when duplicate_object then null; end $$;

-- DM: members of a thread can read/write
do $$ begin
  create policy "dm thread members read" on public.dm_threads for select
    using (auth.uid() = user_a or auth.uid() = user_b);
  create policy "dm messages members read" on public.dm_messages for select
    using (exists (select 1 from public.dm_threads t
      where t.id = thread_id and (auth.uid() = t.user_a or auth.uid() = t.user_b)));
  create policy "dm messages send" on public.dm_messages for insert
    with check (auth.uid() = sender_id and exists (select 1 from public.dm_threads t
      where t.id = thread_id and (auth.uid() = t.user_a or auth.uid() = t.user_b)));
exception when duplicate_object then null; end $$;
