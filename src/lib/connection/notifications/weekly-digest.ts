import 'server-only';

import { listEvents } from '@/lib/connection/repo';
import type { ConnectionEvent } from '@/lib/connection/types';
import {
  HANAKAI_NOTIFICATION_SCHEDULES,
  WEEKLY_MONDAY_DIGEST_SCHEDULE,
  type WeeklyDigestEmailPayload,
} from '@/lib/connection/notifications/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hanakai.kranz.design';

/** 追加募集を最上部、通常イベントをその下に並べ替え */
export function sortEventsForWeeklyDigest(events: ConnectionEvent[]): {
  additionalRecruitmentEvents: ConnectionEvent[];
  recommendedEvents: ConnectionEvent[];
} {
  const upcoming = events.filter((e) => !e.isPast && e.status !== 'closed' && e.status !== 'completed');
  const additional = upcoming.filter((e) => e.recruitmentType === 'additional');
  const standard = upcoming.filter((e) => e.recruitmentType !== 'additional');
  return {
    additionalRecruitmentEvents: additional,
    recommendedEvents: standard.slice(0, 5),
  };
}

export function buildWeeklyDigestPayload(
  recipientEmail: string,
  isLoggedIn: boolean,
  events?: ConnectionEvent[],
): WeeklyDigestEmailPayload {
  const meta = WEEKLY_MONDAY_DIGEST_SCHEDULE.metadata;
  const allEvents = events ?? [];
  const sorted = sortEventsForWeeklyDigest(allEvents);

  return {
    subject: String(meta.subject ?? '今週のHANAKAIイベントをご案内します🌸'),
    recipientEmail,
    additionalRecruitmentEvents: sorted.additionalRecruitmentEvents,
    recommendedEvents: sorted.recommendedEvents,
    myPageUrl: `${SITE_URL}${isLoggedIn ? String(meta.myPagePath ?? '/my') : String(meta.loginPath ?? '/login')}`,
    loginUrl: `${SITE_URL}${String(meta.loginPath ?? '/login')}`,
  };
}

/** 送信基盤接続前のプレビュー用。実際の送信は cron / queue から呼ぶ想定。 */
export async function prepareWeeklyMondayDigest(
  recipientEmail: string,
  isLoggedIn: boolean,
): Promise<WeeklyDigestEmailPayload> {
  const events = await listEvents();
  return buildWeeklyDigestPayload(recipientEmail, isLoggedIn, events);
}

export function listNotificationSchedules() {
  return HANAKAI_NOTIFICATION_SCHEDULES;
}

export function weeklyDigestEmailBody(payload: WeeklyDigestEmailPayload): string {
  const lines: string[] = [
    '今週のHANAKAIイベントをご案内します。',
    '',
  ];

  if (payload.additionalRecruitmentEvents.length > 0) {
    lines.push('🌸 追加募集しています', '');
    for (const e of payload.additionalRecruitmentEvents) {
      lines.push(`・${e.title}（${e.area}）`);
    }
    lines.push('');
  }

  if (payload.recommendedEvents.length > 0) {
    lines.push('おすすめイベント', '');
    for (const e of payload.recommendedEvents) {
      lines.push(`・${e.title}（${e.area}）`);
    }
    lines.push('');
  }

  lines.push(`マイページを見る: ${payload.myPageUrl}`);
  return lines.join('\n');
}
