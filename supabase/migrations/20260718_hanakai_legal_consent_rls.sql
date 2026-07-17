-- Legal consent audit fields + trust column self-update guard

alter table public.hanakai_members
  add column if not exists terms_agreed_at timestamptz,
  add column if not exists privacy_agreed_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists privacy_version text;

create or replace function public.hanakai_guard_member_trust_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;

  if new.identity_verified is distinct from old.identity_verified
     or new.document_upload_status is distinct from old.document_upload_status
     or new.trust_verification_status is distinct from old.trust_verification_status
     or new.trust_verification_date is distinct from old.trust_verification_date
     or new.identity_verification_date is distinct from old.identity_verification_date
     or new.verification_source is distinct from old.verification_source
     or new.identity_verification_method is distinct from old.identity_verification_method
     or new.external_verification_ref is distinct from old.external_verification_ref
     or coalesce(new.safety_flags, '{}'::text[]) is distinct from coalesce(old.safety_flags, '{}'::text[])
  then
    raise exception 'HANAKAI_MEMBER_TRUST_UPDATE_FORBIDDEN';
  end if;

  return new;
end;
$$;

drop trigger if exists hanakai_members_guard_trust on public.hanakai_members;
create trigger hanakai_members_guard_trust
  before update on public.hanakai_members
  for each row
  execute function public.hanakai_guard_member_trust_columns();

-- Keep deletion audit rows after auth.users removal
alter table public.hanakai_account_deletion_requests
  drop constraint if exists hanakai_account_deletion_requests_auth_user_id_fkey;

alter table public.hanakai_account_deletion_requests
  alter column auth_user_id drop not null;
