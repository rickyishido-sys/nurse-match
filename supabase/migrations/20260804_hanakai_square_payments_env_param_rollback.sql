-- Rollback for 20260804_hanakai_square_payments_env_param.sql
--
-- SAFETY (read before running on Production):
--   * This RESTORES the legacy 4-arg RPC that HARDCODES environment='sandbox'.
--     On Production that re-introduces the charge bug (payment rows become
--     'sandbox' while cards are 'production' => NO_CARD => payment_failed).
--     Therefore this rollback is safe ONLY on Preview/sandbox, or on Production
--     ONLY if the application is simultaneously reverted to a build that does
--     NOT pass p_environment (i.e. the 4-arg caller).
--   * The application code (participation-finalize.ts) passing p_environment
--     still works against the restored 4-arg function because PostgREST/PL-pgSQL
--     would fail to resolve the extra key — so DO NOT run this rollback while a
--     build that sends p_environment is live on the same database.
--   * No table data is modified; only the function definition changes.

-- 1. Drop the 5-arg environment-parameterized version.
drop function if exists public.hanakai_select_participants_for_payment(uuid, uuid[], uuid, timestamptz, text);

-- 2. Recreate the original 4-arg version from 20260802 (environment='sandbox').
create or replace function public.hanakai_select_participants_for_payment(
  p_event_id uuid,
  p_selected_application_ids uuid[],
  p_decided_by_member_id uuid,
  p_payment_deadline_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event record;
  v_now timestamptz := now();
  v_selected_count int;
  v_confirmed_count int;
  v_reserved_count int;
  v_available int;
  v_app record;
  v_not_selected_count int := 0;
  v_payment_deadline timestamptz;
  v_payments jsonb := '[]'::jsonb;
  v_idempotency text;
  v_payment_id uuid;
begin
  if p_selected_application_ids is null then
    return jsonb_build_object('ok', false, 'error', '参加メンバーを1名以上選択してください');
  end if;

  v_selected_count := coalesce(array_length(p_selected_application_ids, 1), 0);
  if v_selected_count = 0 then
    return jsonb_build_object('ok', false, 'error', '参加メンバーを1名以上選択してください');
  end if;

  if v_selected_count <> (select count(distinct x) from unnest(p_selected_application_ids) as t(x)) then
    return jsonb_build_object('ok', false, 'error', '重複した申請が含まれています');
  end if;

  select
    id, title, capacity, status, is_past, host_member_id, start_at,
    additional_recruitment_enabled, additional_recruitment_deadline
  into v_event
  from public.hanakai_events
  where id = p_event_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'イベントが見つかりません');
  end if;

  if v_event.is_past then
    return jsonb_build_object('ok', false, 'error', 'すでに終了した体験です');
  end if;

  if v_event.status in ('cancelled', 'completed') then
    return jsonb_build_object('ok', false, 'error', 'この体験は選定できません');
  end if;

  if v_event.start_at <= v_now + interval '3 hours' then
    return jsonb_build_object('ok', false, 'error', '開催3時間前以降は新規決済できません');
  end if;

  select count(*) into v_confirmed_count
  from public.hanakai_event_applications
  where event_id = p_event_id and status = 'confirmed';

  select count(*) into v_reserved_count
  from public.hanakai_event_applications
  where event_id = p_event_id
    and status in ('payment_processing', 'payment_failed')
    and (payment_deadline_at is null or payment_deadline_at > v_now);

  v_available := v_event.capacity - v_confirmed_count - v_reserved_count;
  if v_selected_count > v_available then
    return jsonb_build_object('ok', false, 'error', '定員を超えて選択することはできません');
  end if;

  if exists (
    select 1 from public.hanakai_event_applications
    where event_id = p_event_id
      and id = any(p_selected_application_ids)
      and status <> 'pending'
  ) then
    return jsonb_build_object('ok', false, 'error', '選定対象外の申請が含まれています');
  end if;

  v_payment_deadline := coalesce(
    p_payment_deadline_at,
    least(v_now + interval '24 hours', v_event.start_at - interval '3 hours')
  );

  for v_app in
    select id, member_id
    from public.hanakai_event_applications
    where event_id = p_event_id and id = any(p_selected_application_ids)
  loop
    update public.hanakai_event_applications
    set
      status = 'payment_processing',
      decided_at = v_now,
      decided_by_member_id = p_decided_by_member_id,
      selected_at = v_now,
      payment_deadline_at = v_payment_deadline,
      confirmation_token = null,
      confirmed_at = null
    where id = v_app.id;

    v_idempotency := encode(extensions.gen_random_bytes(16), 'hex');

    insert into public.hanakai_participation_payments (
      event_id, application_id, member_id,
      amount, currency, status,
      idempotency_key, attempt_number,
      payment_deadline_at, environment
    ) values (
      p_event_id, v_app.id, v_app.member_id,
      500, 'JPY', 'pending',
      v_idempotency, 1,
      v_payment_deadline, 'sandbox'
    )
    on conflict do nothing
    returning id into v_payment_id;

    if v_payment_id is not null then
      v_payments := v_payments || jsonb_build_object(
        'payment_id', v_payment_id,
        'application_id', v_app.id,
        'member_id', v_app.member_id,
        'idempotency_key', v_idempotency
      );
    end if;
  end loop;

  update public.hanakai_event_applications
  set
    status = 'not_selected',
    decided_at = v_now,
    decided_by_member_id = p_decided_by_member_id,
    not_selected_at = v_now
  where event_id = p_event_id
    and status = 'pending'
    and id <> all(p_selected_application_ids);

  get diagnostics v_not_selected_count = row_count;

  update public.hanakai_events
  set last_participant_selection_at = v_now
  where id = p_event_id;

  return jsonb_build_object(
    'ok', true,
    'selected_count', v_selected_count,
    'not_selected_count', v_not_selected_count,
    'payments', v_payments,
    'payment_deadline_at', v_payment_deadline
  );
end;
$$;

revoke all on function public.hanakai_select_participants_for_payment(uuid, uuid[], uuid, timestamptz) from public;
grant execute on function public.hanakai_select_participants_for_payment(uuid, uuid[], uuid, timestamptz) to service_role;
