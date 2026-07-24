-- 主催者一括決定: participants_decided_at + 原子的 RPC
-- Preview 検証用。Production への適用は別途オペレーションで実施すること。

create extension if not exists pgcrypto with schema extensions;

alter table public.hanakai_events
  add column if not exists participants_decided_at timestamptz;

alter table public.hanakai_event_applications
  add column if not exists confirmation_token text,
  add column if not exists confirmed_at timestamptz,
  add column if not exists decided_by_member_id uuid references public.hanakai_members(id) on delete set null;

alter table public.hanakai_event_applications
  drop constraint if exists hanakai_event_applications_status_check;

alter table public.hanakai_event_applications
  add constraint hanakai_event_applications_status_check
  check (status in ('pending', 'awaiting_confirmation', 'confirmed', 'rejected', 'cancelled'));

create unique index if not exists idx_hanakai_app_confirmation_token
  on public.hanakai_event_applications (confirmation_token)
  where confirmation_token is not null;

comment on column public.hanakai_events.participants_decided_at is
  '主催者（または運営）が参加メンバーを一括決定した日時。NULL の間のみ pending 申請の選定が可能。';

create index if not exists idx_hanakai_events_participants_decided
  on public.hanakai_events (participants_decided_at)
  where participants_decided_at is not null;

create or replace function public.hanakai_finalize_event_participants(
  p_event_id uuid,
  p_selected_application_ids uuid[],
  p_decided_by_member_id uuid,
  p_site_base_url text default '',
  p_e2e_inject_failure text default null
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
  v_app record;
  v_token text;
  v_confirm_url text;
  v_not_selected_count int := 0;
  v_notifications int := 0;
  v_selected jsonb := '[]'::jsonb;
  v_site_base text := rtrim(coalesce(p_site_base_url, ''), '/');
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
    id,
    title,
    capacity,
    status,
    participants_decided_at,
    approval_mode,
    is_past,
    host_member_id
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

  if v_event.status = 'cancelled' then
    return jsonb_build_object('ok', false, 'error', '中止された体験です');
  end if;

  if v_event.status = 'completed' then
    return jsonb_build_object('ok', false, 'error', '完了した体験です');
  end if;

  if v_event.participants_decided_at is not null then
    return jsonb_build_object('ok', false, 'error', 'すでに参加メンバーが決定されています');
  end if;

  if coalesce(v_event.approval_mode, 'host_approval') = 'auto' then
    return jsonb_build_object('ok', false, 'error', '自動承認の体験では選定操作は不要です');
  end if;

  if v_selected_count > v_event.capacity then
    return jsonb_build_object('ok', false, 'error', '定員を超えて選択することはできません');
  end if;

  if (
    select count(*)
    from public.hanakai_event_applications a
    where a.event_id = p_event_id
      and a.status = 'pending'
      and a.id = any (p_selected_application_ids)
  ) <> v_selected_count then
    return jsonb_build_object('ok', false, 'error', '無効な申請が含まれています');
  end if;

  for v_app in
    select a.id, a.member_id
    from public.hanakai_event_applications a
    where a.event_id = p_event_id
      and a.id = any (p_selected_application_ids)
      and a.status = 'pending'
    order by a.id
  loop
    v_token := encode(extensions.gen_random_bytes(32), 'hex');

    update public.hanakai_event_applications
    set
      status = 'awaiting_confirmation',
      decided_at = v_now,
      decided_by_member_id = p_decided_by_member_id,
      confirmation_token = v_token,
      confirmed_at = null
    where id = v_app.id
      and event_id = p_event_id
      and status = 'pending';

    if not found then
      raise exception 'HANAKAI_FINALIZE_SELECTED_UPDATE_FAILED:%', v_app.id;
    end if;

    v_confirm_url := case
      when v_site_base <> '' then
        v_site_base || '/events/participation/confirm?token=' || v_token || '&action=confirm'
      else null
    end;

    v_selected := v_selected || jsonb_build_array(
      jsonb_build_object(
        'application_id', v_app.id,
        'member_id', v_app.member_id,
        'confirmation_token', v_token,
        'confirm_url', v_confirm_url
      )
    );
  end loop;

  for v_app in
    select a.id, a.member_id
    from public.hanakai_event_applications a
    where a.event_id = p_event_id
      and a.status = 'pending'
      and not (a.id = any (p_selected_application_ids))
    order by a.id
  loop
    update public.hanakai_event_applications
    set
      status = 'rejected',
      decided_at = v_now,
      decided_by_member_id = p_decided_by_member_id
    where id = v_app.id
      and event_id = p_event_id
      and status = 'pending';

    if not found then
      raise exception 'HANAKAI_FINALIZE_REJECTED_UPDATE_FAILED:%', v_app.id;
    end if;

    v_not_selected_count := v_not_selected_count + 1;
  end loop;

  if p_e2e_inject_failure = 'before_notifications' then
    raise exception 'HANAKAI_E2E_INJECT_FAILURE:before_notifications';
  end if;

  for v_app in
    select value as row
    from jsonb_array_elements(v_selected)
  loop
    if not exists (
      select 1
      from public.hanakai_event_operation_notifications n
      where n.event_id = p_event_id
        and n.member_id = (v_app.row ->> 'member_id')::uuid
        and n.notification_type = 'participation_selected'
    ) then
      insert into public.hanakai_event_operation_notifications (
        event_id,
        member_id,
        notification_type,
        channel,
        payload
      )
      values (
        p_event_id,
        (v_app.row ->> 'member_id')::uuid,
        'participation_selected',
        'in_app',
        jsonb_build_object(
          'title', '参加メンバーが決まりました',
          'body', format(
            '「%s」へのご参加が決まりました。%s当日の詳細をご確認ください。',
            v_event.title,
            E'\n'
          ),
          'confirmUrl', v_app.row ->> 'confirm_url'
        )
      );
      v_notifications := v_notifications + 1;
    end if;
  end loop;

  for v_app in
    select a.member_id
    from public.hanakai_event_applications a
    where a.event_id = p_event_id
      and a.status = 'rejected'
      and a.decided_at = v_now
  loop
    if not exists (
      select 1
      from public.hanakai_event_operation_notifications n
      where n.event_id = p_event_id
        and n.member_id = v_app.member_id
        and n.notification_type = 'participation_not_selected'
    ) then
      insert into public.hanakai_event_operation_notifications (
        event_id,
        member_id,
        notification_type,
        channel,
        payload
      )
      values (
        p_event_id,
        v_app.member_id,
        'participation_not_selected',
        'in_app',
        jsonb_build_object(
          'title', '今回の参加メンバーが決まりました',
          'body', format(
            '「%s」は、定員および当日のメンバー構成を踏まえて、%s今回の参加メンバーが決まりました。%s%sお申し込みいただき、ありがとうございました。%sまた別の体験でお会いできることを楽しみにしています。',
            v_event.title,
            E'\n',
            E'\n',
            E'\n',
            E'\n'
          )
        )
      );
      v_notifications := v_notifications + 1;
    end if;
  end loop;

  if p_e2e_inject_failure = 'after_notifications' then
    raise exception 'HANAKAI_E2E_INJECT_FAILURE:after_notifications';
  end if;

  update public.hanakai_events
  set
    participants_decided_at = v_now,
    status = 'closed',
    updated_at = v_now
  where id = p_event_id
    and participants_decided_at is null;

  if not found then
    raise exception 'HANAKAI_FINALIZE_EVENT_LOCK_LOST:%', p_event_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'selected_count', v_selected_count,
    'not_selected_count', v_not_selected_count,
    'notifications_queued', v_notifications,
    'selected', v_selected
  );
exception
  when others then
    raise;
end;
$$;

revoke all on function public.hanakai_finalize_event_participants(uuid, uuid[], uuid, text, text) from public;
grant execute on function public.hanakai_finalize_event_participants(uuid, uuid[], uuid, text, text) to service_role;
