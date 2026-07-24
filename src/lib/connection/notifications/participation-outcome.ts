import 'server-only';

import { formatEventDate } from '@/lib/connection/data';
import type { ConnectionEvent } from '@/lib/connection/types';

export type ParticipationOutcomeKind = 'selected' | 'not_selected';

export type ParticipationOutcomeNotification = {
  kind: ParticipationOutcomeKind;
  title: string;
  body: string;
  eventTitle: string;
  eventDate: string;
  confirmUrl?: string;
};

export function buildParticipationOutcomeNotification(
  event: ConnectionEvent,
  kind: ParticipationOutcomeKind,
  confirmUrl?: string,
): ParticipationOutcomeNotification {
  const eventDate = formatEventDate(event.startAt);
  if (kind === 'selected') {
    return {
      kind,
      title: '参加メンバーが決まりました',
      body: `「${event.title}」へのご参加が決まりました。\n当日の詳細をご確認ください。`,
      eventTitle: event.title,
      eventDate,
      confirmUrl,
    };
  }
  return {
    kind,
    title: '今回の参加メンバーが決まりました',
    body: [
      `「${event.title}」は、定員および当日のメンバー構成を踏まえて、`,
      '今回の参加メンバーが決まりました。',
      '',
      'お申し込みいただき、ありがとうございました。',
      'また別の体験でお会いできることを楽しみにしています。',
    ].join('\n'),
    eventTitle: event.title,
    eventDate,
  };
}

/** 送信基盤未接続時はログのみ。偽装しない。 */
export function logParticipationOutcomeNotification(payload: {
  memberId: string;
  eventId: string;
  channel: 'in_app_outbox' | 'email_log';
  notification: ParticipationOutcomeNotification;
}): void {
  console.log('HANAKAI_PARTICIPATION_OUTCOME_NOTIFICATION', {
    memberId: payload.memberId,
    eventId: payload.eventId,
    channel: payload.channel,
    kind: payload.notification.kind,
    title: payload.notification.title,
    body: payload.notification.body,
    confirmUrl: payload.notification.confirmUrl ?? null,
  });
}
