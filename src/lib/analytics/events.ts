export const ANALYTICS_EVENTS = [
  'landing_view',
  'event_list_view',
  'event_detail_view',
  'signup_start',
  'signup_complete',
  'identity_submit',
  'identity_approved',
  'event_apply_start',
  'event_apply_complete',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;
