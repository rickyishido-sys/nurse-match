-- HANAKAI Connection UX: 追加募集・参加確認フロー・通知スケジュール
-- Scope: hanakai_events.recruitment_type, application confirmation, notification schedules

-- ---------- 追加募集フラグ ----------
alter table public.hanakai_events
  add column if not exists recruitment_type text not null default 'standard'
    check (recruitment_type in ('standard', 'additional'));

comment on column public.hanakai_events.recruitment_type is
  'standard=通常募集, additional=追加募集（一覧・週次メール最優先表示）';

-- ---------- 参加確認フロー ----------
alter table public.hanakai_event_applications
  add column if not exists confirmation_token text,
  add column if not exists confirmed_at timestamptz;

-- status に awaiting_confirmation / cancelled を許可（既存 CHECK を更新）
alter table public.hanakai_event_applications
  drop constraint if exists hanakai_event_applications_status_check;

alter table public.hanakai_event_applications
  add constraint hanakai_event_applications_status_check
  check (status in ('pending', 'awaiting_confirmation', 'confirmed', 'rejected', 'cancelled'));

create unique index if not exists idx_hanakai_app_confirmation_token
  on public.hanakai_event_applications (confirmation_token)
  where confirmation_token is not null;

-- ---------- 通知スケジュール（送信基盤は別途。構造のみ） ----------
create table if not exists public.hanakai_notification_schedules (
  id            text primary key,
  name          text not null,
  channel       text not null default 'email' check (channel in ('email', 'push')),
  cron_expr     text not null,
  timezone      text not null default 'Asia/Tokyo',
  enabled       boolean not null default true,
  template_key  text not null,
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_hanakai_notification_schedules_touch on public.hanakai_notification_schedules;
create trigger trg_hanakai_notification_schedules_touch
  before update on public.hanakai_notification_schedules
  for each row execute function public.hanakai_touch_updated_at();

alter table public.hanakai_notification_schedules enable row level security;

-- 週次月曜案内（毎週月曜 10:00 JST）
insert into public.hanakai_notification_schedules (id, name, channel, cron_expr, timezone, template_key, metadata)
values (
  'weekly_monday_digest',
  '毎週月曜 イベント案内',
  'email',
  '0 10 * * 1',
  'Asia/Tokyo',
  'weekly_event_digest',
  '{"subject":"今週のHANAKAIイベントをご案内します🌸","myPagePath":"/my","loginPath":"/login"}'::jsonb
)
on conflict (id) do update set
  name = excluded.name,
  cron_expr = excluded.cron_expr,
  template_key = excluded.template_key,
  metadata = excluded.metadata,
  updated_at = now();

-- 参加決定通知（運営選考後・ユーザー確認待ち）
insert into public.hanakai_notification_schedules (id, name, channel, cron_expr, timezone, enabled, template_key, metadata)
values (
  'participation_decision',
  '参加決定・確認依頼',
  'email',
  '',
  'Asia/Tokyo',
  true,
  'participation_decision',
  '{"subject":"あなたの参加イベントが決まりました","confirmLabel":"参加を確定する","declineLabel":"今回は参加しない"}'::jsonb
)
on conflict (id) do update set
  name = excluded.name,
  template_key = excluded.template_key,
  metadata = excluded.metadata,
  updated_at = now();
