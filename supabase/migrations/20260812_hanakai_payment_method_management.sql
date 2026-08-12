-- Payment method management: per-application card binding + single active default.
-- DO NOT apply to Production without explicit approval.

-- 1) Application → chosen payment method (internal id, not Square card id copy)
alter table public.hanakai_event_applications
  add column if not exists payment_method_id uuid
    references public.hanakai_payment_methods(id) on delete set null;

create index if not exists idx_hanakai_event_applications_payment_method
  on public.hanakai_event_applications (payment_method_id)
  where payment_method_id is not null;

comment on column public.hanakai_event_applications.payment_method_id is
  'Payment method selected at apply time; used for later participation charge.';

-- 2) Normalize any duplicate defaults before unique index
with ranked as (
  select
    id,
    row_number() over (
      partition by member_id, environment
      order by is_default desc, created_at desc, id desc
    ) as rn
  from public.hanakai_payment_methods
  where status = 'active'
    and is_default = true
)
update public.hanakai_payment_methods pm
set is_default = false,
    updated_at = now()
from ranked r
where pm.id = r.id
  and r.rn > 1;

-- 3) At most one active default per member + environment
create unique index if not exists uq_hanakai_payment_methods_one_default
  on public.hanakai_payment_methods (member_id, environment)
  where status = 'active' and is_default = true;

-- 4) Atomic set-default (clears other defaults in same env)
create or replace function public.hanakai_set_default_payment_method(
  p_member_id uuid,
  p_payment_method_id uuid,
  p_environment text
)
returns public.hanakai_payment_methods
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.hanakai_payment_methods;
begin
  if p_environment not in ('sandbox', 'production') then
    raise exception 'invalid environment';
  end if;

  select *
    into v_row
  from public.hanakai_payment_methods
  where id = p_payment_method_id
    and member_id = p_member_id
    and environment = p_environment
    and status = 'active'
  for update;

  if not found then
    raise exception 'payment method not found or not active';
  end if;

  update public.hanakai_payment_methods
  set is_default = false,
      updated_at = now()
  where member_id = p_member_id
    and environment = p_environment
    and status = 'active'
    and is_default = true
    and id <> p_payment_method_id;

  update public.hanakai_payment_methods
  set is_default = true,
      updated_at = now()
  where id = p_payment_method_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.hanakai_set_default_payment_method(uuid, uuid, text) from public;
grant execute on function public.hanakai_set_default_payment_method(uuid, uuid, text) to service_role;
