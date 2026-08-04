-- =====================================================================
-- READ-ONLY Production (xuex) pre-check for HANAKAI Square payments.
-- Run in the xuex Supabase SQL editor (or psql). Contains ZERO DDL/DML.
-- Nothing here modifies data or schema. Safe to run on production.
-- =====================================================================

-- ---------------------------------------------------------------------
-- A. Target TABLE existence (NULL = absent)
-- ---------------------------------------------------------------------
select 'table' as kind, t as name,
       to_regclass('public.' || t) is not null as present
from (values
  -- 20260716_event_operations
  ('hanakai_event_checkins'),
  ('hanakai_event_checkin_attempts'),
  ('hanakai_event_revenue_reports'),
  ('hanakai_event_revenue_documents'),
  ('hanakai_event_invoices'),
  ('hanakai_event_operation_notifications'),
  -- 20260718_legal_consent
  ('hanakai_account_deletion_requests'),
  -- 20260802_square_payments
  ('hanakai_square_customers'),
  ('hanakai_payment_methods'),
  ('hanakai_payment_consents'),
  ('hanakai_participation_payments'),
  ('hanakai_square_webhook_events')
) as v(t)
order by present, name;

-- ---------------------------------------------------------------------
-- B. Target COLUMN existence on existing base tables
-- ---------------------------------------------------------------------
with wanted(table_name, column_name, src) as (values
  -- 20260716 on hanakai_events
  ('hanakai_events','external_recruitment','20260716'),
  ('hanakai_events','venue_permission_confirmed','20260716'),
  ('hanakai_events','venue_fee_explained','20260716'),
  ('hanakai_events','billing_target','20260716'),
  ('hanakai_events','checkin_code_hash','20260716'),
  ('hanakai_events','ended_at','20260716'),
  -- 20260718 on hanakai_members
  ('hanakai_members','terms_agreed_at','20260718'),
  ('hanakai_members','privacy_agreed_at','20260718'),
  ('hanakai_members','terms_version','20260718'),
  ('hanakai_members','privacy_version','20260718'),
  -- 20260802 on hanakai_events (fee/schedule)
  ('hanakai_events','application_deadline','20260802'),
  ('hanakai_events','participant_selection_deadline','20260802'),
  ('hanakai_events','event_fee_type','20260802'),
  ('hanakai_events','event_fee_amount','20260802'),
  ('hanakai_events','minimum_participants','20260802'),
  ('hanakai_events','last_participant_selection_at','20260802'),
  -- 20260802 on hanakai_event_applications
  ('hanakai_event_applications','payment_deadline_at','20260802'),
  ('hanakai_event_applications','selected_at','20260802'),
  ('hanakai_event_applications','not_selected_at','20260802')
)
select w.src, w.table_name, w.column_name,
       (c.column_name is not null) as present
from wanted w
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = w.table_name
 and c.column_name = w.column_name
order by present, w.table_name, w.column_name;

-- ---------------------------------------------------------------------
-- C. Target FUNCTION (RPC) existence
-- ---------------------------------------------------------------------
select p.proname as function_name, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'hanakai_select_participants_for_payment',
    'hanakai_expire_overdue_participation_payments',
    'hanakai_guard_member_trust_columns'
  )
order by p.proname;

-- C2. Does the select RPC hardcode 'sandbox'? (production charge blocker)
--     Look for a line containing "'sandbox'" in the function body.
select p.proname,
       (pg_get_functiondef(p.oid) ilike '%''sandbox''%') as body_mentions_sandbox
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'hanakai_select_participants_for_payment';

-- ---------------------------------------------------------------------
-- D. Trigger existence (20260718 trust guard)
-- ---------------------------------------------------------------------
select tgname as trigger_name, c.relname as table_name
from pg_trigger tg
join pg_class c on c.oid = tg.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and not tg.tgisinternal
  and tgname = 'hanakai_members_guard_trust';

-- ---------------------------------------------------------------------
-- E. CHECK constraint definition on hanakai_event_applications.status
--    (20260802 drops & re-adds this; existing out-of-set values would
--     make the ADD CONSTRAINT fail)
-- ---------------------------------------------------------------------
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.hanakai_event_applications'::regclass
  and contype = 'c'
  and conname = 'hanakai_event_applications_status_check';

-- ---------------------------------------------------------------------
-- F. Existing application status values + counts, flag out-of-set values
--    Target set the new constraint allows:
--    pending, payment_processing, payment_failed, confirmed, payment_expired,
--    not_selected, cancelled, refunded, awaiting_confirmation, rejected
-- ---------------------------------------------------------------------
select status,
       count(*) as rows,
       (status not in (
         'pending','payment_processing','payment_failed','confirmed','payment_expired',
         'not_selected','cancelled','refunded','awaiting_confirmation','rejected'
       )) as blocks_new_constraint
from public.hanakai_event_applications
group by status
order by blocks_new_constraint desc, rows desc;

-- ---------------------------------------------------------------------
-- G. Row counts (core + payment tables). Uses dynamic SQL so missing
--    tables are skipped instead of erroring. Emits NOTICE lines.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  n bigint;
begin
  foreach t in array array[
    'hanakai_members','hanakai_events','hanakai_event_applications',
    'hanakai_square_customers','hanakai_payment_methods','hanakai_payment_consents',
    'hanakai_participation_payments','hanakai_square_webhook_events'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('select count(*) from public.%I', t) into n;
      raise notice 'COUNT % = %', t, n;
    else
      raise notice 'COUNT % = TABLE_ABSENT', t;
    end if;
  end loop;
end $$;
