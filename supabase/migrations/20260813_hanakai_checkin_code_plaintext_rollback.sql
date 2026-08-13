-- Rollback: remove host-readable check-in code column (hash remains).
alter table public.hanakai_events
  drop column if exists checkin_code;
