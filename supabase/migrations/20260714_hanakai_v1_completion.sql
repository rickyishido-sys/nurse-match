-- HANAKAI Connection Ver1.0 completion
-- Blocks, participation cancel metadata, event cancellation

-- ---------- member blocks ----------
create table if not exists public.hanakai_member_blocks (
  id                  uuid primary key default gen_random_uuid(),
  blocker_member_id   uuid not null references public.hanakai_members(id) on delete cascade,
  blocked_member_id   uuid not null references public.hanakai_members(id) on delete cascade,
  created_at          timestamptz not null default now(),
  constraint hanakai_member_blocks_no_self check (blocker_member_id <> blocked_member_id),
  constraint hanakai_member_blocks_unique unique (blocker_member_id, blocked_member_id)
);

create index if not exists idx_hanakai_blocks_blocker
  on public.hanakai_member_blocks (blocker_member_id, created_at desc);

create index if not exists idx_hanakai_blocks_blocked
  on public.hanakai_member_blocks (blocked_member_id);

alter table public.hanakai_member_blocks enable row level security;

do $$ begin
  create policy "hk_blocks_blocker_select" on public.hanakai_member_blocks
    for select using (
      blocker_member_id in (
        select id from public.hanakai_members where auth_user_id = auth.uid()
      )
    );
  create policy "hk_blocks_blocker_insert" on public.hanakai_member_blocks
    for insert with check (
      blocker_member_id in (
        select id from public.hanakai_members where auth_user_id = auth.uid()
      )
    );
  create policy "hk_blocks_blocker_delete" on public.hanakai_member_blocks
    for delete using (
      blocker_member_id in (
        select id from public.hanakai_members where auth_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- ---------- application cancel metadata ----------
alter table public.hanakai_event_applications
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancel_reason text;

-- ---------- event cancellation ----------
alter table public.hanakai_events
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text;

alter table public.hanakai_events
  drop constraint if exists hanakai_events_status_check;

alter table public.hanakai_events
  add constraint hanakai_events_status_check
  check (status in ('open', 'almost_full', 'full', 'closed', 'completed', 'cancelled'));
