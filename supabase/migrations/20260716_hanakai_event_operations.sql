-- HANAKAI Event Operations — check-in, revenue reporting, referral service fees, invoicing
-- Idempotent: safe to re-run

alter table public.hanakai_events
  add column if not exists external_recruitment text not null default 'hanakai_only',
  add column if not exists venue_permission_confirmed boolean not null default false,
  add column if not exists venue_fee_explained boolean not null default false,
  add column if not exists billing_target text not null default 'host',
  add column if not exists venue_billing_name text,
  add column if not exists venue_billing_contact text,
  add column if not exists venue_billing_phone text,
  add column if not exists venue_billing_email text,
  add column if not exists venue_billing_address text,
  add column if not exists venue_billing_consent boolean not null default false,
  add column if not exists checkin_code_hash text,
  add column if not exists ended_at timestamptz,
  add column if not exists revenue_report_requested_at timestamptz,
  add column if not exists revenue_report_reminder_12h_at timestamptz,
  add column if not exists revenue_report_reminder_24h_at timestamptz;

-- Drop legacy plaintext column if present from earlier drafts
alter table public.hanakai_events drop column if exists checkin_code;

create table if not exists public.hanakai_event_checkins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.hanakai_events(id) on delete cascade,
  member_id uuid not null references public.hanakai_members(id) on delete cascade,
  application_id uuid references public.hanakai_event_applications(id) on delete set null,
  method text not null default 'code',
  status text not null default 'checked_in',
  checked_in_at timestamptz not null default now(),
  checked_in_by_member_id uuid references public.hanakai_members(id) on delete set null,
  cancelled_at timestamptz,
  cancelled_by_member_id uuid references public.hanakai_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hanakai_event_checkins_status_chk check (status in ('checked_in', 'cancelled')),
  constraint hanakai_event_checkins_method_chk check (method in ('code', 'manual'))
);

create unique index if not exists idx_hanakai_event_checkins_active
  on public.hanakai_event_checkins (event_id, member_id)
  where status = 'checked_in';

create index if not exists idx_hanakai_event_checkins_event
  on public.hanakai_event_checkins (event_id, checked_in_at desc);

create table if not exists public.hanakai_event_checkin_attempts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.hanakai_events(id) on delete cascade,
  member_id uuid references public.hanakai_members(id) on delete set null,
  ip_hash text,
  success boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index if not exists idx_hanakai_event_checkin_attempts_rate
  on public.hanakai_event_checkin_attempts (event_id, member_id, attempted_at desc);

create table if not exists public.hanakai_event_revenue_reports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.hanakai_events(id) on delete cascade,
  reported_by_member_id uuid references public.hanakai_members(id) on delete set null,
  total_participants int not null,
  gross_sales_tax_included int not null,
  sales_tax_rate numeric(6,4) not null default 0.1,
  billing_tax_rate numeric(6,4) not null default 0.1,
  notes text,
  status text not null default 'submitted',
  admin_memo text,
  revision_reason text,
  submitted_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by_member_id uuid references public.hanakai_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hanakai_event_revenue_reports_status_chk
    check (status in ('draft', 'submitted', 'revision_requested', 'approved', 'rejected')),
  constraint hanakai_event_revenue_reports_participants_chk check (total_participants > 0),
  constraint hanakai_event_revenue_reports_sales_chk check (gross_sales_tax_included >= 0)
);

-- Legacy column rename support
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hanakai_event_revenue_reports' and column_name = 'tax_rate'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hanakai_event_revenue_reports' and column_name = 'sales_tax_rate'
  ) then
    alter table public.hanakai_event_revenue_reports rename column tax_rate to sales_tax_rate;
  end if;
end $$;

alter table public.hanakai_event_revenue_reports
  add column if not exists sales_tax_rate numeric(6,4) not null default 0.1,
  add column if not exists billing_tax_rate numeric(6,4) not null default 0.1;

create index if not exists idx_hanakai_event_revenue_reports_event
  on public.hanakai_event_revenue_reports (event_id, submitted_at desc);

create table if not exists public.hanakai_event_revenue_documents (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.hanakai_event_revenue_reports(id) on delete cascade,
  storage_path text not null,
  document_type text not null default 'other',
  file_name text,
  mime_type text,
  created_at timestamptz not null default now()
);

-- Drop public URL column — use signed URLs at read time
alter table public.hanakai_event_revenue_documents drop column if exists document_url;

create table if not exists public.hanakai_event_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  event_id uuid not null references public.hanakai_events(id) on delete cascade,
  report_id uuid not null references public.hanakai_event_revenue_reports(id) on delete cascade,
  billing_target text not null,
  billing_name text not null,
  billing_contact text,
  billing_phone text,
  billing_email text,
  billing_address text,
  hanakai_checkin_count int not null,
  total_participants int not null,
  gross_sales_tax_excluded int not null,
  referral_ratio numeric(8,6) not null,
  hanakai_target_sales int not null,
  service_fee_tax_excluded int not null,
  sales_tax_rate numeric(6,4) not null default 0.1,
  billing_tax_rate numeric(6,4) not null default 0.1,
  tax_amount int not null,
  total_amount_tax_included int not null,
  invoice_date date not null,
  due_date date not null,
  payment_status text not null default 'pending',
  stripe_invoice_id text,
  admin_memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hanakai_event_invoices_payment_status_chk
    check (payment_status in ('pending', 'paid', 'overdue', 'cancelled'))
);

alter table public.hanakai_event_invoices
  add column if not exists sales_tax_rate numeric(6,4) not null default 0.1,
  add column if not exists billing_tax_rate numeric(6,4) not null default 0.1;

create unique index if not exists idx_hanakai_event_invoices_report
  on public.hanakai_event_invoices (report_id);

create index if not exists idx_hanakai_event_invoices_event
  on public.hanakai_event_invoices (event_id, invoice_date desc);

create table if not exists public.hanakai_event_operation_notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.hanakai_events(id) on delete cascade,
  member_id uuid references public.hanakai_members(id) on delete set null,
  notification_type text not null,
  channel text not null default 'in_app',
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('event-revenue-documents', 'event-revenue-documents', false)
on conflict (id) do update set public = false;

alter table public.hanakai_event_checkins enable row level security;
alter table public.hanakai_event_checkin_attempts enable row level security;
alter table public.hanakai_event_revenue_reports enable row level security;
alter table public.hanakai_event_revenue_documents enable row level security;
alter table public.hanakai_event_invoices enable row level security;
alter table public.hanakai_event_operation_notifications enable row level security;

do $$ begin
  create policy "hanakai_event_checkins_select" on public.hanakai_event_checkins for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "hanakai_event_checkins_insert" on public.hanakai_event_checkins for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "hanakai_event_checkins_update" on public.hanakai_event_checkins for update using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hanakai_event_checkin_attempts_insert" on public.hanakai_event_checkin_attempts for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "hanakai_event_checkin_attempts_select" on public.hanakai_event_checkin_attempts for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hanakai_event_revenue_reports_select" on public.hanakai_event_revenue_reports for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "hanakai_event_revenue_reports_insert" on public.hanakai_event_revenue_reports for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "hanakai_event_revenue_reports_update" on public.hanakai_event_revenue_reports for update using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hanakai_event_revenue_documents_select" on public.hanakai_event_revenue_documents for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "hanakai_event_revenue_documents_insert" on public.hanakai_event_revenue_documents for insert with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hanakai_event_invoices_select" on public.hanakai_event_invoices for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "hanakai_event_invoices_insert" on public.hanakai_event_invoices for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "hanakai_event_invoices_update" on public.hanakai_event_invoices for update using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "hanakai_event_operation_notifications_select" on public.hanakai_event_operation_notifications for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "hanakai_event_operation_notifications_insert" on public.hanakai_event_operation_notifications for insert with check (true);
exception when duplicate_object then null; end $$;

-- Storage: private bucket, service role uploads; signed URLs for reads
do $$ begin
  create policy "event_revenue_docs_insert" on storage.objects for insert
    with check (bucket_id = 'event-revenue-documents');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "event_revenue_docs_select" on storage.objects for select
    using (bucket_id = 'event-revenue-documents');
exception when duplicate_object then null; end $$;
