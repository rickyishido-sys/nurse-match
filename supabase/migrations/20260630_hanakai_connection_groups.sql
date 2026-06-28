-- ============================================================
-- HANAKAI Connection — Event participant groups (ADDITIVE)
-- イベントごとの参加者限定グループ（投稿・写真・利用許可）
-- ============================================================

-- ---------- connection groups（イベント1件につき1グループ） ----------
create table if not exists public.hanakai_connection_groups (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null unique references public.hanakai_events(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_hk_groups_event on public.hanakai_connection_groups(event_id);

-- ---------- group members（主催者・承認済み参加者・管理者） ----------
create table if not exists public.hanakai_group_members (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.hanakai_connection_groups(id) on delete cascade,
  member_id   uuid not null references public.hanakai_members(id) on delete cascade,
  role        text not null default 'participant', -- host | participant | admin
  joined_at   timestamptz not null default now(),
  unique (group_id, member_id)
);
create index if not exists idx_hk_group_members_group on public.hanakai_group_members(group_id);

-- ---------- group posts（テキスト投稿） ----------
create table if not exists public.hanakai_group_posts (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.hanakai_connection_groups(id) on delete cascade,
  member_id     uuid not null references public.hanakai_members(id) on delete cascade,
  body          text not null default '',
  is_hidden     boolean not null default false,
  report_count  int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists idx_hk_group_posts_group on public.hanakai_group_posts(group_id, created_at desc);

-- ---------- group photos（参加者限定写真） ----------
create table if not exists public.hanakai_group_photos (
  id                  uuid primary key default gen_random_uuid(),
  group_id            uuid not null references public.hanakai_connection_groups(id) on delete cascade,
  member_id           uuid not null references public.hanakai_members(id) on delete cascade,
  post_id             uuid references public.hanakai_group_posts(id) on delete set null,
  storage_path        text not null default '',
  url                 text not null,
  usage_status        text not null default 'private', -- private | requested | approved | rejected | reported
  is_hidden           boolean not null default false,
  report_count        int not null default 0,
  consent_acknowledged boolean not null default false,
  created_at          timestamptz not null default now()
);
create index if not exists idx_hk_group_photos_group on public.hanakai_group_photos(group_id, created_at desc);

-- ---------- photo usage requests（管理者 → 利用許可リクエスト） ----------
create table if not exists public.hanakai_group_photo_usage_requests (
  id          uuid primary key default gen_random_uuid(),
  photo_id    uuid not null references public.hanakai_group_photos(id) on delete cascade,
  scopes      text[] not null default '{}', -- site | event_page | sns | ad | print
  message     text not null default '',
  status      text not null default 'pending', -- pending | approved | rejected
  created_at  timestamptz not null default now(),
  responded_at timestamptz
);
create index if not exists idx_hk_photo_usage_photo on public.hanakai_group_photo_usage_requests(photo_id);

-- ---------- updated_at triggers ----------
drop trigger if exists trg_hk_groups_touch on public.hanakai_connection_groups;
create trigger trg_hk_groups_touch
  before update on public.hanakai_connection_groups
  for each row execute function public.hanakai_touch_updated_at();

-- ---------- RLS ----------
alter table public.hanakai_connection_groups      enable row level security;
alter table public.hanakai_group_members          enable row level security;
alter table public.hanakai_group_posts            enable row level security;
alter table public.hanakai_group_photos           enable row level security;
alter table public.hanakai_group_photo_usage_requests enable row level security;

-- グループメンバーだけが閲覧（アプリ層でも二重チェック）
do $$ begin
  create policy "hk_groups_member_read" on public.hanakai_connection_groups
    for select using (
      id in (
        select gm.group_id from public.hanakai_group_members gm
        join public.hanakai_members m on m.id = gm.member_id
        where m.auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hk_group_members_read" on public.hanakai_group_members
    for select using (
      group_id in (
        select gm.group_id from public.hanakai_group_members gm
        join public.hanakai_members m on m.id = gm.member_id
        where m.auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hk_group_posts_read" on public.hanakai_group_posts
    for select using (
      group_id in (
        select gm.group_id from public.hanakai_group_members gm
        join public.hanakai_members m on m.id = gm.member_id
        where m.auth_user_id = auth.uid()
      )
    );
  create policy "hk_group_posts_insert" on public.hanakai_group_posts
    for insert with check (
      member_id in (select id from public.hanakai_members where auth_user_id = auth.uid())
      and group_id in (
        select gm.group_id from public.hanakai_group_members gm
        join public.hanakai_members m on m.id = gm.member_id
        where m.auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hk_group_photos_read" on public.hanakai_group_photos
    for select using (
      group_id in (
        select gm.group_id from public.hanakai_group_members gm
        join public.hanakai_members m on m.id = gm.member_id
        where m.auth_user_id = auth.uid()
      )
    );
  create policy "hk_group_photos_insert" on public.hanakai_group_photos
    for insert with check (
      member_id in (select id from public.hanakai_members where auth_user_id = auth.uid())
      and group_id in (
        select gm.group_id from public.hanakai_group_members gm
        join public.hanakai_members m on m.id = gm.member_id
        where m.auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- ---------- Storage: group-photos ----------
insert into storage.buckets (id, name, public)
values ('group-photos', 'group-photos', true)
on conflict (id) do nothing;

do $$ begin
  create policy "hk_group_photos_storage_read" on storage.objects
    for select using (bucket_id = 'group-photos');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hk_group_photos_storage_insert" on storage.objects
    for insert with check (bucket_id = 'group-photos' and auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
