-- Rollback for 20260812_hanakai_payment_method_management.sql

drop function if exists public.hanakai_set_default_payment_method(uuid, uuid, text);

drop index if exists public.uq_hanakai_payment_methods_one_default;
drop index if exists public.idx_hanakai_event_applications_payment_method;

alter table public.hanakai_event_applications
  drop column if exists payment_method_id;
