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
  'launch_modal_view',
  'launch_modal_signup_click',
  'launch_modal_later_click',
  'empty_state_create_event_click',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;
