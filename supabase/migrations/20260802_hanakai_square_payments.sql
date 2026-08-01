-- HANAKAI Square participation fee (500 JPY) — Preview / Sandbox only.
-- DO NOT apply to shared Production DB without explicit ops approval.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- A. Square customers
-- ---------------------------------------------------------------------------
create table if not exists public.hanakai_square_customers (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.hanakai_members(id) on delete cascade,
  square_customer_id text not null,
  environment text not null check (environment in ('sandbox', 'production')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, environment),
  unique (square_customer_id, environment)
);

create index if not exists idx_hanakai_square_customers_member
  on public.hanakai_square_customers (member_id);

-- ---------------------------------------------------------------------------
-- B. Saved payment methods (card on file metadata only)
-- ---------------------------------------------------------------------------
create table if not exists public.hanakai_payment_methods (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.hanakai_members(id) on delete cascade,
  square_customer_id text not null,
  square_card_id text not null,
  brand text,
  last_4 text,
  exp_month smallint,
  exp_year smallint,
  cardholder_name text,
  is_default boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'disabled', 'expired')),
  environment text not null check (environment in ('sandbox', 'production')),
  consent_version text not null,
  consented_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  disabled_at timestamptz,
  unique (square_card_id, environment)
);

create index if not exists idx_hanakai_payment_methods_member
  on public.hanakai_payment_methods (member_id, environment)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- C. Card-save consent audit
-- ---------------------------------------------------------------------------
create table if not exists public.hanakai_payment_consents (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.hanakai_members(id) on delete cascade,
  consent_version text not null,
  consented_at timestamptz not null default now(),
  consent_context text not null default 'first_event_application',
  platform text not null default 'web' check (platform in ('web', 'ios', 'android')),
  payment_method_id uuid references public.hanakai_payment_methods(id) on delete set null,
  environment text not null check (environment in ('sandbox', 'production')),
  created_at timestamptz not null default now()
);

create index if not exists idx_hanakai_payment_consents_member
  on public.hanakai_payment_consents (member_id, consented_at desc);

-- ---------------------------------------------------------------------------
-- D. Participation fee payments (500 JPY fixed server-side)
-- ---------------------------------------------------------------------------
create table if not exists public.hanakai_participation_payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.hanakai_events(id) on delete cascade,
  application_id uuid not null references public.hanakai_event_applications(id) on delete cascade,
  member_id uuid not null references public.hanakai_members(id) on delete cascade,
  amount int not null default 500 check (amount = 500),
  currency text not null default 'JPY' check (currency = 'JPY'),
  status text not null default 'pending'
    check (status in (
      'pending',
      'processing',
      'completed',
      'failed',
      'expired',
      'refunded',
      'cancelled'
    )),
  square_payment_id text,
  square_customer_id text,
  square_card_id text,
  idempotency_key text not null,
  attempt_number int not null default 1 check (attempt_number >= 1),
  failure_code text,
  failure_message text,
  payment_deadline_at timestamptz,
  attempted_at timestamptz,
  paid_at timestamptz,
  failed_at timestamptz,
  expired_at timestamptz,
  refunded_at timestamptz,
  square_refund_id text,
  environment text not null check (environment in ('sandbox', 'production')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One active charge intent per application
create unique index if not exists idx_hanakai_participation_payments_active_app
  on public.hanakai_participation_payments (application_id)
  where status in ('pending', 'processing', 'failed');

create unique index if not exists idx_hanakai_participation_payments_idempotency
  on public.hanakai_participation_payments (idempotency_key);

create unique index if not exists idx_hanakai_participation_payments_square_payment
  on public.hanakai_participation_payments (square_payment_id)
  where square_payment_id is not null;

create index if not exists idx_hanakai_participation_payments_event
  on public.hanakai_participation_payments (event_id, status);

create index if not exists idx_hanakai_participation_payments_deadline
  on public.hanakai_participation_payments (payment_deadline_at)
  where status = 'failed' and payment_deadline_at is not null;

-- ---------------------------------------------------------------------------
-- E. Webhook deduplication
-- ---------------------------------------------------------------------------
create table if not exists public.hanakai_square_webhook_events (
  id uuid primary key default gen_random_uuid(),
  square_event_id text not null unique,
  event_type text not null,
  square_object_id text,
  payload jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status text not null default 'received'
    check (status in ('received', 'processed', 'failed', 'ignored')),
  failure_message text
);

-- ---------------------------------------------------------------------------
-- F. Event schedule / fee metadata
-- ---------------------------------------------------------------------------
alter table public.hanakai_events
  add column if not exists application_deadline timestamptz,
  add column if not exists participant_selection_deadline timestamptz,
  add column if not exists additional_recruitment_enabled boolean not null default false,
  add column if not exists additional_recruitment_deadline timestamptz,
  add column if not exists final_payment_deadline timestamptz,
  add column if not exists event_fee_type text default 'fixed'
    check (event_fee_type is null or event_fee_type in (
      'free', 'fixed', 'estimate', 'range', 'variable', 'undecided'
    )),
  add column if not exists event_fee_amount int,
  add column if not exists event_fee_min int,
  add column if not exists event_fee_max int,
  add column if not exists event_fee_payment_recipient text,
  add column if not exists event_fee_payment_method text default 'on_site',
  add column if not exists event_fee_includes text,
  add column if not exists event_fee_excludes text,
  add column if not exists event_fee_notes text,
  add column if not exists minimum_participants int,
  add column if not exists last_participant_selection_at timestamptz;

-- ---------------------------------------------------------------------------
-- G. Application status expansion (legacy values retained)
-- ---------------------------------------------------------------------------
alter table public.hanakai_event_applications
  add column if not exists payment_deadline_at timestamptz,
  add column if not exists selected_at timestamptz,
  add column if not exists not_selected_at timestamptz;

alter table public.hanakai_event_applications
  drop constraint if exists hanakai_event_applications_status_check;

alter table public.hanakai_event_applications
  add constraint hanakai_event_applications_status_check
  check (status in (
    'pending',
    'payment_processing',
    'payment_failed',
    'confirmed',
    'payment_expired',
    'not_selected',
    'cancelled',
    'refunded',
    'awaiting_confirmation',
    'rejected'
  ));

comment on column public.hanakai_event_applications.status is
  'pending=選定待ち, payment_processing=決済処理中, payment_failed=再決済待ち, confirmed=正式参加, payment_expired=期限切れ, not_selected=今回の参加案内なし, cancelled=辞退, refunded=返金済み. awaiting_confirmation/rejected=legacy互換';

-- ---------------------------------------------------------------------------
-- H. RPC: select participants → payment_processing (no Square in transaction)
-- ---------------------------------------------------------------------------
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

  -- Block new charges within 3 hours of start
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

-- Expire overdue failed payments (cron-safe, idempotent)
create or replace function public.hanakai_expire_overdue_participation_payments(
  p_limit int default 100
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_expired int := 0;
  v_app record;
begin
  for v_app in
    select pp.id as payment_id, pp.application_id, pp.event_id, pp.member_id
    from public.hanakai_participation_payments pp
    join public.hanakai_event_applications app on app.id = pp.application_id
    where pp.status = 'failed'
      and app.status = 'payment_failed'
      and pp.payment_deadline_at is not null
      and pp.payment_deadline_at <= v_now
    order by pp.payment_deadline_at
    limit greatest(p_limit, 1)
    for update skip locked
  loop
    update public.hanakai_participation_payments
    set status = 'expired', expired_at = v_now, updated_at = v_now
    where id = v_app.payment_id and status = 'failed';

    update public.hanakai_event_applications
    set status = 'payment_expired', updated_at = v_now
    where id = v_app.application_id and status = 'payment_failed';

    v_expired := v_expired + 1;
  end loop;

  return jsonb_build_object('ok', true, 'expired_count', v_expired);
end;
$$;

revoke all on function public.hanakai_expire_overdue_participation_payments(int) from public;
grant execute on function public.hanakai_expire_overdue_participation_payments(int) to service_role;
