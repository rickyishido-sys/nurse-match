-- =============================================================================
-- HANAKAI Connection 本番テストユーザー整理
-- STEP 2 / 3: 削除実行（不可逆）
-- =============================================================================
-- 前提:
--   - STEP 1 (01_preview.sql) を実行し、削除対象を確認済みであること
--   - safety_message が OK または WARNING（rickyishido が admin role で保護）であること
--   - 下記 CONFIG が STEP 1 と同一であること
--   - 実行前に Supabase プロジェクトのバックアップを推奨
--
-- 使い方:
--   1) 下の v_execute を false のまま一度実行 → ドライラン（ROLLBACK）
--   2) 問題なければ v_execute := true に変更して再実行 → COMMIT
-- =============================================================================

DO $$
DECLARE
  v_execute boolean := false;  -- ★ 確認後に true へ変更
  v_protected_count int;
  v_delete_auth_count int;
  v_delete_member_count int;
BEGIN
  -- -------------------------------------------------------------------------
  -- CONFIG（STEP 1 と必ず同じ内容にする）
  -- -------------------------------------------------------------------------
  CREATE TEMP TABLE _hk_cleanup_config ON COMMIT DROP AS
  SELECT
    ARRAY['rickyishido@gmail.com']::text[] AS protected_emails,
    ARRAY[
      -- 例: 'add57a23-5dba-4d08-94d2-fc3088a005ac'::uuid
    ]::uuid[] AS connection_admin_member_ids;

  CREATE TEMP TABLE _hk_protected_auth ON COMMIT DROP AS
  SELECT DISTINCT u.id AS auth_user_id
  FROM auth.users u
  CROSS JOIN _hk_cleanup_config c
  WHERE u.email IS NOT NULL
    AND lower(u.email) = ANY (SELECT lower(e) FROM unnest(c.protected_emails) AS e)
  UNION
  SELECT pu.id
  FROM public.users pu
  WHERE pu.role IN ('super_admin', 'female_admin', 'male_admin')
  UNION
  SELECT hm.auth_user_id
  FROM public.hanakai_members hm
  CROSS JOIN _hk_cleanup_config c
  WHERE hm.id = ANY (c.connection_admin_member_ids)
    AND hm.auth_user_id IS NOT NULL;

  CREATE TEMP TABLE _hk_protected_members ON COMMIT DROP AS
  SELECT DISTINCT hm.id AS member_id
  FROM public.hanakai_members hm
  WHERE hm.auth_user_id IN (SELECT auth_user_id FROM _hk_protected_auth)
  UNION
  SELECT hm.id
  FROM public.hanakai_members hm
  CROSS JOIN _hk_cleanup_config c
  WHERE hm.id = ANY (c.connection_admin_member_ids);

  CREATE TEMP TABLE _hk_delete_auth ON COMMIT DROP AS
  SELECT u.id AS auth_user_id
  FROM auth.users u
  WHERE u.id NOT IN (SELECT auth_user_id FROM _hk_protected_auth);

  CREATE TEMP TABLE _hk_delete_members ON COMMIT DROP AS
  SELECT hm.id AS member_id
  FROM public.hanakai_members hm
  WHERE hm.id NOT IN (SELECT member_id FROM _hk_protected_members)
    AND (
      hm.auth_user_id IS NULL
      OR hm.auth_user_id IN (SELECT auth_user_id FROM _hk_delete_auth)
    );

  CREATE TEMP TABLE _hk_delete_events ON COMMIT DROP AS
  SELECT e.id AS event_id
  FROM public.hanakai_events e
  WHERE e.host_member_id IN (SELECT member_id FROM _hk_delete_members);

  CREATE TEMP TABLE _hk_groups_to_purge ON COMMIT DROP AS
  SELECT DISTINCT g.id AS group_id
  FROM public.hanakai_connection_groups g
  WHERE g.event_id IN (SELECT event_id FROM _hk_delete_events)
  UNION
  SELECT DISTINCT gm.group_id
  FROM public.hanakai_group_members gm
  WHERE gm.member_id IN (SELECT member_id FROM _hk_delete_members);

  SELECT COUNT(*) INTO v_protected_count FROM _hk_protected_auth;
  SELECT COUNT(*) INTO v_delete_auth_count FROM _hk_delete_auth;
  SELECT COUNT(*) INTO v_delete_member_count FROM _hk_delete_members;

  IF v_protected_count = 0 THEN
    RAISE EXCEPTION 'ABORT: 保護対象ユーザーが0件です。CONFIG を確認してください。';
  END IF;

  RAISE NOTICE 'protected_auth: %, delete_auth: %, delete_members: %',
    v_protected_count, v_delete_auth_count, v_delete_member_count;

  IF NOT v_execute THEN
    RAISE NOTICE 'DRY RUN: v_execute = false のため削除は行いません。確認後 v_execute := true に変更してください。';
    RETURN;
  END IF;

  -- -------------------------------------------------------------------------
  -- 子テーブルから順に削除
  -- -------------------------------------------------------------------------

  DELETE FROM public.hanakai_group_photo_usage_requests r
  USING public.hanakai_group_photos p
  WHERE r.photo_id = p.id
    AND (
      p.member_id IN (SELECT member_id FROM _hk_delete_members)
      OR p.group_id IN (SELECT group_id FROM _hk_groups_to_purge)
    );

  DELETE FROM public.hanakai_group_photos p
  WHERE p.member_id IN (SELECT member_id FROM _hk_delete_members)
     OR p.group_id IN (SELECT group_id FROM _hk_groups_to_purge);

  DELETE FROM public.hanakai_group_posts p
  WHERE p.member_id IN (SELECT member_id FROM _hk_delete_members)
     OR p.group_id IN (SELECT group_id FROM _hk_groups_to_purge);

  DELETE FROM public.hanakai_group_members gm
  WHERE gm.member_id IN (SELECT member_id FROM _hk_delete_members)
     OR gm.group_id IN (SELECT group_id FROM _hk_groups_to_purge);

  DELETE FROM public.hanakai_connection_groups g
  WHERE g.id IN (SELECT group_id FROM _hk_groups_to_purge);

  DELETE FROM public.hanakai_event_applications a
  WHERE a.member_id IN (SELECT member_id FROM _hk_delete_members)
     OR a.event_id IN (SELECT event_id FROM _hk_delete_events);

  DELETE FROM public.hanakai_bloom_timeline t
  WHERE t.member_id IN (SELECT member_id FROM _hk_delete_members);

  DELETE FROM public.hanakai_bloom_memories m
  WHERE m.member_id IN (SELECT member_id FROM _hk_delete_members);

  DELETE FROM public.hanakai_bloom_versions v
  WHERE v.member_id IN (SELECT member_id FROM _hk_delete_members);

  DELETE FROM public.hanakai_bloom_profiles bp
  WHERE bp.member_id IN (SELECT member_id FROM _hk_delete_members);

  DELETE FROM public.hanakai_member_photos ph
  WHERE ph.member_id IN (SELECT member_id FROM _hk_delete_members);

  DELETE FROM public.hanakai_member_social_links sl
  WHERE sl.member_id IN (SELECT member_id FROM _hk_delete_members);

  DELETE FROM public.hanakai_reports r
  WHERE r.reporter_member_id IN (SELECT member_id FROM _hk_delete_members)
     OR r.target_member_id IN (SELECT member_id FROM _hk_delete_members)
     OR r.resolved_by_member_id IN (SELECT member_id FROM _hk_delete_members);

  DELETE FROM public.hanakai_contact_inquiries ci
  WHERE ci.member_id IN (SELECT member_id FROM _hk_delete_members);

  DELETE FROM public.hanakai_account_deletion_requests dr
  WHERE dr.member_id IN (SELECT member_id FROM _hk_delete_members)
     OR dr.auth_user_id IN (SELECT auth_user_id FROM _hk_delete_auth);

  DELETE FROM public.hanakai_events e
  WHERE e.id IN (SELECT event_id FROM _hk_delete_events);

  DELETE FROM public.hanakai_members hm
  WHERE hm.id IN (SELECT member_id FROM _hk_delete_members);

  -- public.users（一般 user のみ。admin role は protected 済み）
  DELETE FROM public.users pu
  WHERE pu.id IN (SELECT auth_user_id FROM _hk_delete_auth)
    AND pu.role = 'user';

  -- Storage: profile-photos（Supabase は storage.objects への直接 DELETE を禁止）
  -- 必要なら Dashboard → Storage または Storage API で手動削除してください。
  -- DELETE FROM storage.objects so
  -- WHERE so.bucket_id = 'profile-photos'
  --   AND EXISTS (
  --     SELECT 1
  --     FROM _hk_delete_auth da
  --     WHERE so.name LIKE da.auth_user_id::text || '/%'
  --   );

  -- auth.users（最後に削除 → identities / sessions 等は cascade）
  DELETE FROM auth.users u
  WHERE u.id IN (SELECT auth_user_id FROM _hk_delete_auth);

  RAISE NOTICE 'DELETE COMPLETE: auth.users % 件削除', v_delete_auth_count;
END $$;

-- =============================================================================
-- 実行後すぐに STEP 3 (03_verify.sql) を実行してください。
-- =============================================================================
