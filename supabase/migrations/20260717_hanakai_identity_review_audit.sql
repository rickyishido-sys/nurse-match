-- HANAKAI Connection — 本人確認審査の監査ログ
create table if not exists public.hanakai_identity_review_logs (
  id                  uuid primary key default gen_random_uuid(),
  member_id           uuid not null references public.hanakai_members(id) on delete cascade,
  reviewer_member_id  uuid references public.hanakai_members(id) on delete set null,
  action              text not null,
  note                text,
  document_ref        text,
  created_at          timestamptz not null default now()
);

create index if not exists idx_hanakai_identity_review_logs_member
  on public.hanakai_identity_review_logs(member_id, created_at desc);

alter table public.hanakai_identity_review_logs enable row level security;
