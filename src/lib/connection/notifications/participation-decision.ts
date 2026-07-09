import 'server-only';

import { formatEventDate } from '@/lib/connection/data';
import {
  PARTICIPATION_DECISION_SCHEDULE,
  type ParticipationDecisionEmailPayload,
} from '@/lib/connection/notifications/types';
import type { ConnectionEvent } from '@/lib/connection/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hanakai.kranz.design';

export function buildParticipationDecisionPayload(
  recipientEmail: string,
  event: ConnectionEvent,
  confirmationToken: string,
): ParticipationDecisionEmailPayload {
  const meta = PARTICIPATION_DECISION_SCHEDULE.metadata;
  const base = `${SITE_URL}/events/participation/confirm?token=${encodeURIComponent(confirmationToken)}`;

  return {
    subject: String(meta.subject ?? 'あなたの参加イベントが決まりました'),
    recipientEmail,
    eventTitle: event.title,
    eventDate: formatEventDate(event.startAt),
    confirmUrl: `${base}&action=confirm`,
    declineUrl: `${base}&action=decline`,
    confirmLabel: String(meta.confirmLabel ?? '参加を確定する'),
    declineLabel: String(meta.declineLabel ?? '今回は参加しない'),
  };
}

/** 送信基盤接続前のログ出力用。実際の送信は mailer から呼ぶ想定。 */
export function logParticipationDecisionEmail(payload: ParticipationDecisionEmailPayload): void {
  console.log('HANAKAI_PARTICIPATION_DECISION_EMAIL', {
    to: payload.recipientEmail,
    subject: payload.subject,
    eventTitle: payload.eventTitle,
    confirmUrl: payload.confirmUrl,
    declineUrl: payload.declineUrl,
  });
}

export function participationDecisionEmailBody(payload: ParticipationDecisionEmailPayload): string {
  return [
    'あなたの参加イベントが決まりました。',
    '',
    `イベント: ${payload.eventTitle}`,
    `日時: ${payload.eventDate}`,
    '',
    `【${payload.confirmLabel}】`,
    payload.confirmUrl,
    '',
    `【${payload.declineLabel}】`,
    payload.declineUrl,
  ].join('\n');
}
