-- ============================================================
-- HANAKAI Connection — Account deletion (ADDITIVE)
-- 論理削除 + 削除リクエスト記録
-- ============================================================

alter table public.hanakai_members
  add column if not exists status text not null default 'active',
  add column if not exists deleted_at timestamptz;

create index if not exists idx_hanakai_members_status
  on public.hanakai_members(status);

create table if not exists public.hanakai_account_deletion_requests (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references public.hanakai_members(id) on delete cascade,
  auth_user_id  uuid not null references auth.users(id) on delete cascade,
  reason        text,
  status        text not null default 'completed',
  requested_at  timestamptz not null default now(),
  completed_at  timestamptz
);

create index if not exists idx_hanakai_deletion_requests_member
  on public.hanakai_account_deletion_requests(member_id);

alter table public.hanakai_account_deletion_requests enable row level security;

do $$ begin
  create policy "hk_deletion_self_insert" on public.hanakai_account_deletion_requests
    for insert with check (
      auth.uid() = auth_user_id
      and member_id in (
        select id from public.hanakai_members where auth_user_id = auth.uid()
      )
    );
  create policy "hk_deletion_self_read" on public.hanakai_account_deletion_requests
    for select using (auth.uid() = auth_user_id);
exception when duplicate_object then null; end $$;
