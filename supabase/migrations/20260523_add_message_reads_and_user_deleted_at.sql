alter table public.users
  add column if not exists deleted_at timestamptz;

create index if not exists idx_users_deleted_at on public.users(deleted_at);

create table if not exists public.message_reads (
  user_id uuid not null references public.users(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

create index if not exists idx_message_reads_match on public.message_reads(match_id, user_id);
