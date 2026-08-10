-- ---------------------------------------------------------------------------
-- Enable Row Level Security on the Square payment tables.
--
-- 20260802_hanakai_square_payments.sql created these five tables but did NOT
-- enable RLS. In Supabase, the anon/authenticated roles receive privileges on
-- new public tables by default, so with RLS off the payment data (Square
-- customer/payment-method IDs, card brand/last4, payment history, consents,
-- webhook payloads) was reachable with the public anon key.
--
-- Every other hanakai_* table already has RLS enabled. These tables are only
-- ever accessed server-side via the service_role (which has BYPASSRLS), so we
-- enable RLS with NO policies — anon/authenticated get zero rows and cannot
-- write, while the app keeps working. This mirrors the existing
-- hanakai_group_photo_usage_requests table (rls on, 0 policies).
--
-- Idempotent: ENABLE ROW LEVEL SECURITY / REVOKE are safe to re-run.
-- ---------------------------------------------------------------------------

alter table public.hanakai_square_customers        enable row level security;
alter table public.hanakai_payment_methods         enable row level security;
alter table public.hanakai_payment_consents        enable row level security;
alter table public.hanakai_participation_payments  enable row level security;
alter table public.hanakai_square_webhook_events   enable row level security;

-- Defense in depth: drop the broad default grants. service_role is unaffected
-- (it bypasses RLS and retains its own grants). No client role should touch
-- these tables directly.
revoke all on public.hanakai_square_customers        from anon, authenticated;
revoke all on public.hanakai_payment_methods         from anon, authenticated;
revoke all on public.hanakai_payment_consents        from anon, authenticated;
revoke all on public.hanakai_participation_payments  from anon, authenticated;
revoke all on public.hanakai_square_webhook_events   from anon, authenticated;
