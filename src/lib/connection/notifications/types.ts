import type { ConnectionEvent } from '@/lib/connection/types';

export type NotificationChannel = 'email' | 'push';

export type NotificationSchedule = {
  id: string;
  name: string;
  channel: NotificationChannel;
  cronExpr: string;
  timezone: string;
  enabled: boolean;
  templateKey: string;
  metadata: Record<string, unknown>;
};

/** 週次月曜 10:00 JST イベント案内メール */
export const WEEKLY_MONDAY_DIGEST_SCHEDULE: NotificationSchedule = {
  id: 'weekly_monday_digest',
  name: '毎週月曜 イベント案内',
  channel: 'email',
  cronExpr: '0 10 * * 1',
  timezone: 'Asia/Tokyo',
  enabled: true,
  templateKey: 'weekly_event_digest',
  metadata: {
    subject: '今週のHANAKAIイベントをご案内します🌸',
    myPagePath: '/my',
    loginPath: '/login',
  },
};

/** 運営選考後の参加決定・確認依頼メール */
export const PARTICIPATION_DECISION_SCHEDULE: NotificationSchedule = {
  id: 'participation_decision',
  name: '参加決定・確認依頼',
  channel: 'email',
  cronExpr: '',
  timezone: 'Asia/Tokyo',
  enabled: true,
  templateKey: 'participation_decision',
  metadata: {
    subject: 'あなたの参加イベントが決まりました',
    confirmLabel: '参加を確定する',
    declineLabel: '今回は参加しない',
  },
};

export const HANAKAI_NOTIFICATION_SCHEDULES: NotificationSchedule[] = [
  WEEKLY_MONDAY_DIGEST_SCHEDULE,
  PARTICIPATION_DECISION_SCHEDULE,
];

export type WeeklyDigestEmailPayload = {
  subject: string;
  recipientEmail: string;
  additionalRecruitmentEvents: ConnectionEvent[];
  recommendedEvents: ConnectionEvent[];
  myPageUrl: string;
  loginUrl: string;
};

export type ParticipationDecisionEmailPayload = {
  subject: string;
  recipientEmail: string;
  eventTitle: string;
  eventDate: string;
  confirmUrl: string;
  declineUrl: string;
  confirmLabel: string;
  declineLabel: string;
};
