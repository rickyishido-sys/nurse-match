-- HANAKAI: 利用規約・プライバシーポリシー同意履歴（本人確認前の明示的同意を記録）
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.hanakai_legal_consent_history (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  member_id uuid references public.hanakai_members (id) on delete set null,
  terms_version text not null,
  privacy_policy_version text not null,
  agreed_at timestamptz not null default now(),
  platform text not null check (platform in ('ios', 'android', 'web')),
  consent_context text not null default 'pre_identity',
  created_at timestamptz not null default now()
);

create index if not exists idx_hanakai_legal_consent_history_auth_user
  on public.hanakai_legal_consent_history (auth_user_id, agreed_at desc);

create index if not exists idx_hanakai_legal_consent_history_member
  on public.hanakai_legal_consent_history (member_id, agreed_at desc);

alter table public.hanakai_legal_consent_history enable row level security;

do $$ begin
  create policy "hk_legal_consent_history_self_insert"
    on public.hanakai_legal_consent_history
    for insert
    with check (auth.uid() = auth_user_id);
  create policy "hk_legal_consent_history_self_read"
    on public.hanakai_legal_consent_history
    for select
    using (auth.uid() = auth_user_id);
exception when duplicate_object then null; end $$;
