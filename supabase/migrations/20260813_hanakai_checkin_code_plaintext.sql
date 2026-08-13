-- Host-visible 4-digit check-in code (hash remains source of truth for verify).
-- Additive only: does not drop or rewrite existing rows.

alter table public.hanakai_events
  add column if not exists checkin_code text;

comment on column public.hanakai_events.checkin_code is
  'Host-readable 4-digit check-in code. Verified via checkin_code_hash.';
