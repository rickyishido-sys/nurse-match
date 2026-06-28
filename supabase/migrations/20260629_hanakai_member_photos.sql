-- ============================================================
-- HANAKAI Connection — Member profile photos (ADDITIVE)
-- 最大6枚のプロフィール写真。将来 category ラベル拡張可能。
-- 既存 Nurse Match テーブル / Storage には一切触れない。
-- ============================================================

create table if not exists public.hanakai_member_photos (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references public.hanakai_members(id) on delete cascade,
  storage_path  text not null default '',
  url           text not null,
  sort_order    int not null default 0,
  -- 将来: self | hobby | work | pet | scenery | event など
  category      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_hanakai_member_photos_member
  on public.hanakai_member_photos(member_id, sort_order);

drop trigger if exists trg_hanakai_member_photos_touch on public.hanakai_member_photos;
create trigger trg_hanakai_member_photos_touch
  before update on public.hanakai_member_photos
  for each row execute function public.hanakai_touch_updated_at();

alter table public.hanakai_member_photos enable row level security;

-- 閲覧は公開（イベント参加者一覧・投稿など）
do $$ begin
  create policy "hk_member_photos_read" on public.hanakai_member_photos
    for select using (true);
exception when duplicate_object then null; end $$;

-- 自分のメンバー行に紐づく写真のみ insert / update / delete
do $$ begin
  create policy "hk_member_photos_self_insert" on public.hanakai_member_photos
    for insert with check (
      member_id in (
        select id from public.hanakai_members where auth_user_id = auth.uid()
      )
    );
  create policy "hk_member_photos_self_update" on public.hanakai_member_photos
    for update using (
      member_id in (
        select id from public.hanakai_members where auth_user_id = auth.uid()
      )
    );
  create policy "hk_member_photos_self_delete" on public.hanakai_member_photos
    for delete using (
      member_id in (
        select id from public.hanakai_members where auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- ---------- Storage bucket: profile-photos ----------
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

do $$ begin
  create policy "hk_profile_photos_read" on storage.objects
    for select using (bucket_id = 'profile-photos');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hk_profile_photos_insert" on storage.objects
    for insert with check (
      bucket_id = 'profile-photos' and auth.role() = 'authenticated'
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hk_profile_photos_update" on storage.objects
    for update using (
      bucket_id = 'profile-photos' and auth.role() = 'authenticated'
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hk_profile_photos_delete" on storage.objects
    for delete using (
      bucket_id = 'profile-photos' and auth.role() = 'authenticated'
    );
exception when duplicate_object then null; end $$;
