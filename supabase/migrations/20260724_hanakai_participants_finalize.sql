-- 主催者一括決定: 二重決定防止タイムスタンプ
-- Preview 検証用。Production への適用は別途オペレーションで実施すること。

alter table public.hanakai_events
  add column if not exists participants_decided_at timestamptz;

comment on column public.hanakai_events.participants_decided_at is
  '主催者（または運営）が参加メンバーを一括決定した日時。NULL の間のみ pending 申請の選定が可能。';

create index if not exists idx_hanakai_events_participants_decided
  on public.hanakai_events (participants_decided_at)
  where participants_decided_at is not null;
