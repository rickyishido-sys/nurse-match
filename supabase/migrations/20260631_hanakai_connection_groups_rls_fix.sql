-- ============================================================
-- HANAKAI Connection — Group RLS fix (ADDITIVE / REPLACES broken policies)
-- 20260630 の再帰ポリシーを修正し、insert / update を追加。
-- service_role なしでも主催者・参加者のグループ操作が可能になる。
-- ============================================================

-- ---------- 再帰の原因となる旧ポリシーを削除 ----------
drop policy if exists "hk_groups_member_read" on public.hanakai_connection_groups;
drop policy if exists "hk_group_members_read" on public.hanakai_group_members;
drop policy if exists "hk_groups_host_insert" on public.hanakai_connection_groups;
drop policy if exists "hk_groups_host_read" on public.hanakai_connection_groups;
drop policy if exists "hk_group_members_insert" on public.hanakai_group_members;
drop policy if exists "hk_group_posts_update" on public.hanakai_group_posts;
drop policy if exists "hk_group_photos_update" on public.hanakai_group_photos;
drop policy if exists "hk_photo_usage_read" on public.hanakai_group_photo_usage_requests;
drop policy if exists "hk_photo_usage_insert" on public.hanakai_group_photo_usage_requests;

-- ---------- groups: 閲覧（group_members を参照しない → 再帰回避） ----------
do $$ begin
  create policy "hk_groups_access_read" on public.hanakai_connection_groups
    for select using (
      event_id in (
        select e.id from public.hanakai_events e
        join public.hanakai_members hm on hm.id = e.host_member_id
        where hm.auth_user_id = auth.uid()
      )
      or event_id in (
        select a.event_id from public.hanakai_event_applications a
        join public.hanakai_members m on m.id = a.member_id
        where m.auth_user_id = auth.uid() and a.status = 'confirmed'
      )
    );
exception when duplicate_object then null; end $$;

-- ---------- groups: 主催者が作成 ----------
do $$ begin
  create policy "hk_groups_host_insert" on public.hanakai_connection_groups
    for insert with check (
      event_id in (
        select e.id from public.hanakai_events e
        join public.hanakai_members m on m.id = e.host_member_id
        where m.auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- ---------- group members: 閲覧 ----------
do $$ begin
  create policy "hk_group_members_access_read" on public.hanakai_group_members
    for select using (
      member_id in (select id from public.hanakai_members where auth_user_id = auth.uid())
      or group_id in (
        select g.id from public.hanakai_connection_groups g
        join public.hanakai_events e on e.id = g.event_id
        join public.hanakai_members hm on hm.id = e.host_member_id
        where hm.auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- ---------- group members: 主催者が参加者追加 / 本人追加 ----------
do $$ begin
  create policy "hk_group_members_insert" on public.hanakai_group_members
    for insert with check (
      group_id in (
        select g.id from public.hanakai_connection_groups g
        join public.hanakai_events e on e.id = g.event_id
        join public.hanakai_members hm on hm.id = e.host_member_id
        where hm.auth_user_id = auth.uid()
      )
      or (
        member_id in (select id from public.hanakai_members where auth_user_id = auth.uid())
        and group_id in (
          select g.id from public.hanakai_connection_groups g
          join public.hanakai_event_applications a on a.event_id = g.event_id
          where a.member_id in (select id from public.hanakai_members where auth_user_id = auth.uid())
            and a.status = 'confirmed'
        )
      )
    );
exception when duplicate_object then null; end $$;

-- ---------- posts / photos: update（通報・非表示・利用許可ステータス） ----------
do $$ begin
  create policy "hk_group_posts_update" on public.hanakai_group_posts
    for update using (
      group_id in (
        select g.id from public.hanakai_connection_groups g
        where g.event_id in (
          select e.id from public.hanakai_events e
          join public.hanakai_members hm on hm.id = e.host_member_id
          where hm.auth_user_id = auth.uid()
        )
        or g.event_id in (
          select a.event_id from public.hanakai_event_applications a
          join public.hanakai_members m on m.id = a.member_id
          where m.auth_user_id = auth.uid() and a.status = 'confirmed'
        )
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hk_group_photos_update" on public.hanakai_group_photos
    for update using (
      group_id in (
        select g.id from public.hanakai_connection_groups g
        where g.event_id in (
          select e.id from public.hanakai_events e
          join public.hanakai_members hm on hm.id = e.host_member_id
          where hm.auth_user_id = auth.uid()
        )
        or g.event_id in (
          select a.event_id from public.hanakai_event_applications a
          join public.hanakai_members m on m.id = a.member_id
          where m.auth_user_id = auth.uid() and a.status = 'confirmed'
        )
      )
    );
exception when duplicate_object then null; end $$;

-- ---------- usage requests ----------
do $$ begin
  create policy "hk_photo_usage_read" on public.hanakai_group_photo_usage_requests
    for select using (
      photo_id in (
        select p.id from public.hanakai_group_photos p
        join public.hanakai_connection_groups g on g.id = p.group_id
        where g.event_id in (
          select e.id from public.hanakai_events e
          join public.hanakai_members hm on hm.id = e.host_member_id
          where hm.auth_user_id = auth.uid()
        )
        or g.event_id in (
          select a.event_id from public.hanakai_event_applications a
          join public.hanakai_members m on m.id = a.member_id
          where m.auth_user_id = auth.uid() and a.status = 'confirmed'
        )
      )
    );
  create policy "hk_photo_usage_insert" on public.hanakai_group_photo_usage_requests
    for insert with check (
      photo_id in (
        select p.id from public.hanakai_group_photos p
        join public.hanakai_connection_groups g on g.id = p.group_id
        where g.event_id in (
          select e.id from public.hanakai_events e
          join public.hanakai_members hm on hm.id = e.host_member_id
          where hm.auth_user_id = auth.uid()
        )
      )
    );
exception when duplicate_object then null; end $$;

-- ---------- posts / photos read: 再帰回避版に差し替え ----------
drop policy if exists "hk_group_posts_read" on public.hanakai_group_posts;
drop policy if exists "hk_group_photos_read" on public.hanakai_group_photos;

do $$ begin
  create policy "hk_group_posts_read" on public.hanakai_group_posts
    for select using (
      group_id in (
        select g.id from public.hanakai_connection_groups g
        where g.event_id in (
          select e.id from public.hanakai_events e
          join public.hanakai_members hm on hm.id = e.host_member_id
          where hm.auth_user_id = auth.uid()
        )
        or g.event_id in (
          select a.event_id from public.hanakai_event_applications a
          join public.hanakai_members m on m.id = a.member_id
          where m.auth_user_id = auth.uid() and a.status = 'confirmed'
        )
      )
    );
  create policy "hk_group_photos_read" on public.hanakai_group_photos
    for select using (
      group_id in (
        select g.id from public.hanakai_connection_groups g
        where g.event_id in (
          select e.id from public.hanakai_events e
          join public.hanakai_members hm on hm.id = e.host_member_id
          where hm.auth_user_id = auth.uid()
        )
        or g.event_id in (
          select a.event_id from public.hanakai_event_applications a
          join public.hanakai_members m on m.id = a.member_id
          where m.auth_user_id = auth.uid() and a.status = 'confirmed'
        )
      )
    );
exception when duplicate_object then null; end $$;

-- posts/photos insert policies also reference group_members — replace
drop policy if exists "hk_group_posts_insert" on public.hanakai_group_posts;
drop policy if exists "hk_group_photos_insert" on public.hanakai_group_photos;

do $$ begin
  create policy "hk_group_posts_insert" on public.hanakai_group_posts
    for insert with check (
      member_id in (select id from public.hanakai_members where auth_user_id = auth.uid())
      and group_id in (
        select g.id from public.hanakai_connection_groups g
        where g.event_id in (
          select e.id from public.hanakai_events e
          join public.hanakai_members hm on hm.id = e.host_member_id
          where hm.auth_user_id = auth.uid()
        )
        or g.event_id in (
          select a.event_id from public.hanakai_event_applications a
          join public.hanakai_members m on m.id = a.member_id
          where m.auth_user_id = auth.uid() and a.status = 'confirmed'
        )
      )
    );
  create policy "hk_group_photos_insert" on public.hanakai_group_photos
    for insert with check (
      member_id in (select id from public.hanakai_members where auth_user_id = auth.uid())
      and group_id in (
        select g.id from public.hanakai_connection_groups g
        where g.event_id in (
          select e.id from public.hanakai_events e
          join public.hanakai_members hm on hm.id = e.host_member_id
          where hm.auth_user_id = auth.uid()
        )
        or g.event_id in (
          select a.event_id from public.hanakai_event_applications a
          join public.hanakai_members m on m.id = a.member_id
          where m.auth_user_id = auth.uid() and a.status = 'confirmed'
        )
      )
    );
exception when duplicate_object then null; end $$;
