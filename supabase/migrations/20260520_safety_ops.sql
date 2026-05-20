alter table if exists reports
  drop constraint if exists reports_status_check,
  add constraint reports_status_check check (status in ('open', 'reviewing', 'resolved', 'dismissed'));

create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_user_id uuid not null references users(id) on delete cascade,
  blocked_user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint blocks_unique_pair unique (blocker_user_id, blocked_user_id),
  constraint blocks_not_self check (blocker_user_id <> blocked_user_id)
);

create table if not exists admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references users(id) on delete cascade,
  target_user_id uuid not null references users(id) on delete cascade,
  action_type text not null check (
    action_type in (
      'verification_status_changed',
      'nurse_verification_status_changed',
      'male_review_status_changed',
      'user_suspended',
      'user_permanent_banned',
      'rejected_reason_updated',
      'internal_memo_updated'
    )
  ),
  before_value text,
  after_value text,
  note text,
  created_at timestamptz not null default now()
);

alter table blocks enable row level security;
alter table admin_actions enable row level security;

drop policy if exists blocks_select_member_or_admin on blocks;
create policy blocks_select_member_or_admin on blocks
for select using (auth.uid() = blocker_user_id or auth.uid() = blocked_user_id or is_admin(auth.uid()));

drop policy if exists blocks_insert_self on blocks;
create policy blocks_insert_self on blocks
for insert with check (auth.uid() = blocker_user_id);

drop policy if exists blocks_delete_self_or_admin on blocks;
create policy blocks_delete_self_or_admin on blocks
for delete using (auth.uid() = blocker_user_id or is_admin(auth.uid()));

drop policy if exists admin_actions_select_admin_only on admin_actions;
create policy admin_actions_select_admin_only on admin_actions
for select using (is_admin(auth.uid()));

drop policy if exists admin_actions_insert_admin_only on admin_actions;
create policy admin_actions_insert_admin_only on admin_actions
for insert with check (is_admin(auth.uid()));
