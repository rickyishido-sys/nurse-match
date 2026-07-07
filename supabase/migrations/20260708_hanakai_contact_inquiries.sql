-- ============================================================
-- HANAKAI Connection — Contact inquiries (ADDITIVE)
-- App Store / Google Play 申請向けお問い合わせ
-- ============================================================

create table if not exists public.hanakai_contact_inquiries (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid references public.hanakai_members(id) on delete set null,
  name        text not null,
  email       text not null,
  category    text not null,
  message     text not null,
  status      text not null default 'new',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_hanakai_contact_inquiries_status
  on public.hanakai_contact_inquiries(status, created_at desc);

create index if not exists idx_hanakai_contact_inquiries_member
  on public.hanakai_contact_inquiries(member_id);

drop trigger if exists trg_hanakai_contact_inquiries_touch on public.hanakai_contact_inquiries;
create trigger trg_hanakai_contact_inquiries_touch
  before update on public.hanakai_contact_inquiries
  for each row execute function public.hanakai_touch_updated_at();

alter table public.hanakai_contact_inquiries enable row level security;

-- insert は誰でも可能（未ログイン含む）
do $$ begin
  create policy "hk_inquiries_public_insert" on public.hanakai_contact_inquiries
    for insert with check (true);
exception when duplicate_object then null; end $$;
