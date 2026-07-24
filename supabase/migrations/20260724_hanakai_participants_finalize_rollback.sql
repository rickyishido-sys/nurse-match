-- Rollback for 20260724_hanakai_finalize_participants_rpc.sql
-- Apply manually only when reverting Preview verification.

revoke all on function public.hanakai_finalize_event_participants(uuid, uuid[], uuid, text, text) from service_role;
drop function if exists public.hanakai_finalize_event_participants(uuid, uuid[], uuid, text, text);

drop index if exists public.idx_hanakai_events_participants_decided;

alter table public.hanakai_events
  drop column if exists participants_decided_at;
