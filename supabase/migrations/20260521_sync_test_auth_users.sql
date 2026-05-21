-- Sync test users between auth.users and public.users.
-- Target emails:
-- - test-female@nursematch.app
-- - test-male@nursematch.app
--
-- This script is designed to be safe:
-- - existence checks before any update
-- - transaction-scoped (migration execution)
-- - raises NOTICE logs for each step
-- - raises EXCEPTION when a required sync cannot be completed safely

do $$
declare
  v_email text;
  v_auth_id uuid;
  v_public_id uuid;
  v_existing_new_user_id uuid;
  v_old_user public.users%rowtype;
  v_temp_email text;
  v_count int;
begin
  foreach v_email in array array['test-female@nursematch.app', 'test-male@nursematch.app']
  loop
    raise notice '--- sync start: % ---', v_email;

    select id
      into v_auth_id
    from auth.users
    where lower(email) = lower(v_email)
    limit 1;

    if v_auth_id is null then
      raise notice 'skip: auth.users not found for %', v_email;
      continue;
    end if;

    select *
      into v_old_user
    from public.users
    where lower(email) = lower(v_email)
    limit 1;

    if v_old_user.id is null then
      raise notice 'skip: public.users not found for %', v_email;
      continue;
    end if;

    v_public_id := v_old_user.id;

    if v_public_id = v_auth_id then
      raise notice 'already synced: email=%, id=%', v_email, v_auth_id;
      continue;
    end if;

    select id
      into v_existing_new_user_id
    from public.users
    where id = v_auth_id
    limit 1;

    if v_existing_new_user_id is not null then
      raise exception 'sync aborted for %: target id % already exists in public.users', v_email, v_auth_id;
    end if;

    v_temp_email := v_old_user.email || '.sync-old-' || left(v_public_id::text, 8);

    update public.users
      set email = v_temp_email,
          phone = null,
          updated_at = now()
    where id = v_public_id;
    get diagnostics v_count = row_count;
    raise notice 'users temp detach updated rows: %', v_count;

    insert into public.users (
      id, email, phone, role, gender, nickname, birthdate, age, location, bio, profile_image_url,
      desired_gender, seeking_gender, onboarding_status, risk_check_status, verification_status,
      identity_document_url, rejected_reason, moderation_action, is_suspended, is_test_user,
      created_at, updated_at
    ) values (
      v_auth_id, v_old_user.email, v_old_user.phone, v_old_user.role, v_old_user.gender, v_old_user.nickname,
      v_old_user.birthdate, v_old_user.age, v_old_user.location, v_old_user.bio, v_old_user.profile_image_url,
      v_old_user.desired_gender, v_old_user.seeking_gender, v_old_user.onboarding_status, v_old_user.risk_check_status,
      v_old_user.verification_status, v_old_user.identity_document_url, v_old_user.rejected_reason,
      v_old_user.moderation_action, v_old_user.is_suspended, v_old_user.is_test_user,
      v_old_user.created_at, now()
    );
    raise notice 'users inserted: old_id=%, new_id=%', v_public_id, v_auth_id;

    if exists(select 1 from public.female_profiles where user_id = v_public_id) then
      update public.female_profiles set user_id = v_auth_id where user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'female_profiles updated: %', v_count;
    end if;

    if exists(select 1 from public.male_profiles where user_id = v_public_id) then
      update public.male_profiles set user_id = v_auth_id where user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'male_profiles updated: %', v_count;
    end if;

    if exists(select 1 from public.profile_images where user_id = v_public_id) then
      update public.profile_images set user_id = v_auth_id where user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'profile_images updated: %', v_count;
    end if;

    if exists(select 1 from public.favorites where user_id = v_public_id or target_user_id = v_public_id) then
      update public.favorites set user_id = v_auth_id where user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'favorites.user_id updated: %', v_count;
      update public.favorites set target_user_id = v_auth_id where target_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'favorites.target_user_id updated: %', v_count;
    end if;

    if exists(select 1 from public.interest_signals where user_id = v_public_id or target_user_id = v_public_id) then
      update public.interest_signals set user_id = v_auth_id where user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'interest_signals.user_id updated: %', v_count;
      update public.interest_signals set target_user_id = v_auth_id where target_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'interest_signals.target_user_id updated: %', v_count;
    end if;

    if exists(select 1 from public.daily_recommendations where user_id = v_public_id or target_user_id = v_public_id) then
      update public.daily_recommendations set user_id = v_auth_id where user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'daily_recommendations.user_id updated: %', v_count;
      update public.daily_recommendations set target_user_id = v_auth_id where target_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'daily_recommendations.target_user_id updated: %', v_count;
    end if;

    if exists(select 1 from public.credits where user_id = v_public_id) then
      update public.credits set user_id = v_auth_id where user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'credits updated: %', v_count;
    end if;

    if exists(select 1 from public.credit_transactions where user_id = v_public_id) then
      update public.credit_transactions set user_id = v_auth_id where user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'credit_transactions updated: %', v_count;
    end if;

    if exists(select 1 from public.messages where sender_id = v_public_id) then
      update public.messages set sender_id = v_auth_id where sender_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'messages.sender_id updated: %', v_count;
    end if;

    if exists(select 1 from public.matches where user_a_id = v_public_id or user_b_id = v_public_id) then
      update public.matches set user_a_id = v_auth_id where user_a_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'matches.user_a_id updated: %', v_count;
      update public.matches set user_b_id = v_auth_id where user_b_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'matches.user_b_id updated: %', v_count;
    end if;

    -- Additional FK references to avoid orphaned old id.
    if exists(select 1 from public.likes where from_user_id = v_public_id or to_user_id = v_public_id) then
      update public.likes set from_user_id = v_auth_id where from_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'likes.from_user_id updated: %', v_count;
      update public.likes set to_user_id = v_auth_id where to_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'likes.to_user_id updated: %', v_count;
    end if;

    if exists(select 1 from public.reports where reporter_id = v_public_id or target_user_id = v_public_id) then
      update public.reports set reporter_id = v_auth_id where reporter_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'reports.reporter_id updated: %', v_count;
      update public.reports set target_user_id = v_auth_id where target_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'reports.target_user_id updated: %', v_count;
    end if;

    if exists(select 1 from public.blocks where blocker_user_id = v_public_id or blocked_user_id = v_public_id) then
      update public.blocks set blocker_user_id = v_auth_id where blocker_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'blocks.blocker_user_id updated: %', v_count;
      update public.blocks set blocked_user_id = v_auth_id where blocked_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'blocks.blocked_user_id updated: %', v_count;
    end if;

    if exists(select 1 from public.admin_action_logs where admin_user_id = v_public_id or target_user_id = v_public_id) then
      update public.admin_action_logs set admin_user_id = v_auth_id where admin_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'admin_action_logs.admin_user_id updated: %', v_count;
      update public.admin_action_logs set target_user_id = v_auth_id where target_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'admin_action_logs.target_user_id updated: %', v_count;
    end if;

    if exists(select 1 from public.admin_audit_logs where admin_user_id = v_public_id or target_user_id = v_public_id) then
      update public.admin_audit_logs set admin_user_id = v_auth_id where admin_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'admin_audit_logs.admin_user_id updated: %', v_count;
      update public.admin_audit_logs set target_user_id = v_auth_id where target_user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'admin_audit_logs.target_user_id updated: %', v_count;
    end if;

    if exists(select 1 from public.risk_checks where user_id = v_public_id or final_decider_id = v_public_id) then
      update public.risk_checks set user_id = v_auth_id where user_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'risk_checks.user_id updated: %', v_count;
      update public.risk_checks set final_decider_id = v_auth_id where final_decider_id = v_public_id;
      get diagnostics v_count = row_count;
      raise notice 'risk_checks.final_decider_id updated: %', v_count;
    end if;

    delete from public.users where id = v_public_id;
    get diagnostics v_count = row_count;
    raise notice 'old users row deleted: %', v_count;

    raise notice 'sync done: email=%, old_id=%, new_id=%', v_email, v_public_id, v_auth_id;
  end loop;
end $$;
