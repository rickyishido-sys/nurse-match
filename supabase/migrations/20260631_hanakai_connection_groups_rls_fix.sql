-- ============================================================
-- HANAKAI Connection — Group RLS supplement (ADDITIVE)
-- 20260630 で不足していた insert / update ポリシーを追加。
-- アプリ層は service_role でも操作するが、直接 API アクセス用の防御層。
-- ============================================================

-- ---------- groups: イベント主催者が作成 ----------
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

-- 主催者は自イベントのグループを event_id で参照可能（メンバー登録前の bootstrap 用）
do $$ begin
  create policy "hk_groups_host_read" on public.hanakai_connection_groups
    for select using (
      event_id in (
        select e.id from public.hanakai_events e
        join public.hanakai_members m on m.id = e.host_member_id
        where m.auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- ---------- group members: 主催者が参加者追加 / 本人が自分を追加 ----------
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
        select gm.group_id from public.hanakai_group_members gm
        join public.hanakai_members m on m.id = gm.member_id
        where m.auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hk_group_photos_update" on public.hanakai_group_photos
    for update using (
      group_id in (
        select gm.group_id from public.hanakai_group_members gm
        join public.hanakai_members m on m.id = gm.member_id
        where m.auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- ---------- usage requests ----------
do $$ begin
  create policy "hk_photo_usage_read" on public.hanakai_group_photo_usage_requests
    for select using (
      photo_id in (
        select p.id from public.hanakai_group_photos p
        join public.hanakai_group_members gm on gm.group_id = p.group_id
        join public.hanakai_members m on m.id = gm.member_id
        where m.auth_user_id = auth.uid()
      )
    );
  create policy "hk_photo_usage_insert" on public.hanakai_group_photo_usage_requests
    for insert with check (
      photo_id in (
        select p.id from public.hanakai_group_photos p
        join public.hanakai_group_members gm on gm.group_id = p.group_id
        join public.hanakai_members m on m.id = gm.member_id
        where m.auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;
