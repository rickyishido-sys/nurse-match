-- Rollback for 20260802_hanakai_square_payments_fix_expiry_rpc.sql
-- Restores the function body from 20260802_hanakai_square_payments.sql (includes updated_at bug).
-- Prefer full square rollback (20260802_hanakai_square_payments_rollback.sql) when removing Square entirely.

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
