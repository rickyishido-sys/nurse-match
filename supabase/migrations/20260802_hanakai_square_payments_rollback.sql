-- Rollback for 20260802_hanakai_square_payments.sql
-- Apply only after backing up affected tables.

drop function if exists public.hanakai_expire_overdue_participation_payments(int);
drop function if exists public.hanakai_select_participants_for_payment(uuid, uuid[], uuid, timestamptz);

alter table public.hanakai_event_applications
  drop constraint if exists hanakai_event_applications_status_check;

-- Migrate new statuses back to legacy before restoring CHECK
update public.hanakai_event_applications set status = 'rejected' where status = 'not_selected';
update public.hanakai_event_applications set status = 'awaiting_confirmation' where status in ('payment_processing', 'payment_failed');
update public.hanakai_event_applications set status = 'cancelled' where status = 'payment_expired';

alter table public.hanakai_event_applications
  add constraint hanakai_event_applications_status_check
  check (status in ('pending', 'awaiting_confirmation', 'confirmed', 'rejected', 'cancelled', 'refunded'));

alter table public.hanakai_event_applications
  drop column if exists payment_deadline_at,
  drop column if exists selected_at,
  drop column if exists not_selected_at;

alter table public.hanakai_events
  drop column if exists application_deadline,
  drop column if exists participant_selection_deadline,
  drop column if exists additional_recruitment_enabled,
  drop column if exists additional_recruitment_deadline,
  drop column if exists final_payment_deadline,
  drop column if exists event_fee_type,
  drop column if exists event_fee_amount,
  drop column if exists event_fee_min,
  drop column if exists event_fee_max,
  drop column if exists event_fee_payment_recipient,
  drop column if exists event_fee_payment_method,
  drop column if exists event_fee_includes,
  drop column if exists event_fee_excludes,
  drop column if exists event_fee_notes,
  drop column if exists minimum_participants,
  drop column if exists last_participant_selection_at;

drop table if exists public.hanakai_square_webhook_events;
drop table if exists public.hanakai_participation_payments;
drop table if exists public.hanakai_payment_consents;
drop table if exists public.hanakai_payment_methods;
drop table if exists public.hanakai_square_customers;
