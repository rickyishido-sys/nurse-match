alter table public.matches
  add column if not exists relationship_status text not null default 'active',
  add column if not exists relationship_started_at timestamptz,
  add column if not exists scheduled_delete_at timestamptz,
  add column if not exists hold_deletion boolean not null default false;

alter table public.matches
  drop constraint if exists matches_relationship_status_check;

alter table public.matches
  add constraint matches_relationship_status_check
  check (relationship_status in ('active', 'relationship_mode', 'scheduled_delete', 'deleted'));

drop policy if exists matches_update_member_or_admin on public.matches;
create policy matches_update_member_or_admin on public.matches
for update using (auth.uid() = user_a_id or auth.uid() = user_b_id or is_admin(auth.uid()))
with check (auth.uid() = user_a_id or auth.uid() = user_b_id or is_admin(auth.uid()));

drop policy if exists messages_insert_member on public.messages;
create policy messages_insert_member on public.messages
for insert with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.matches m
    where m.id = match_id
      and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
      and m.relationship_status = 'active'
  )
);

drop policy if exists likes_insert_female_only on public.likes;
create policy likes_insert_female_only on public.likes
for insert with check (
  auth.uid() = from_user_id
  and exists (
    select 1
    from public.users u
    where u.id = from_user_id
      and u.gender = 'female'
      and u.verification_status = 'approved'
      and u.is_suspended = false
  )
  and not exists (
    select 1
    from public.matches m
    where (m.user_a_id = from_user_id or m.user_b_id = from_user_id)
      and m.relationship_status in ('relationship_mode', 'scheduled_delete')
  )
);
