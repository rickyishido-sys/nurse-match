import type { AnalyticsEventName, AnalyticsPayload } from '@/lib/analytics/events';
import { getGaMeasurementId, getMetaPixelId, getTikTokPixelId } from '@/lib/analytics/config';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (event: string, params?: Record<string, unknown>) => void; page?: () => void };
  }
}

const ONCE_PREFIX = 'hanakai:analytics:once:';

function sanitize(payload?: AnalyticsPayload): Record<string, string | number | boolean> {
  if (!payload) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    out[key] = value;
  }
  return out;
}

function pushDataLayer(event: AnalyticsEventName, params: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

function trackGa(event: AnalyticsEventName, params: Record<string, string | number | boolean>) {
  const id = getGaMeasurementId();
  if (!id || typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', event, params);
}

function trackMeta(event: AnalyticsEventName, params: Record<string, string | number | boolean>) {
  const id = getMetaPixelId();
  if (!id || typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  const map: Partial<Record<AnalyticsEventName, string>> = {
    landing_view: 'PageView',
    event_list_view: 'ViewContent',
    event_detail_view: 'ViewContent',
    signup_start: 'Lead',
    signup_complete: 'CompleteRegistration',
    identity_submit: 'SubmitApplication',
    identity_approved: 'CustomizeProduct',
    event_apply_start: 'InitiateCheckout',
    event_apply_complete: 'Purchase',
  };
  const metaEvent = map[event] ?? 'CustomEvent';
  if (metaEvent === 'CustomEvent') {
    window.fbq('trackCustom', event, params);
  } else {
    window.fbq('track', metaEvent, params);
  }
}

function trackTikTok(event: AnalyticsEventName, params: Record<string, string | number | boolean>) {
  const id = getTikTokPixelId();
  if (!id || typeof window === 'undefined' || !window.ttq?.track) return;
  const map: Partial<Record<AnalyticsEventName, string>> = {
    landing_view: 'ViewContent',
    event_list_view: 'ViewContent',
    event_detail_view: 'ViewContent',
    signup_start: 'ClickButton',
    signup_complete: 'CompleteRegistration',
    identity_submit: 'SubmitForm',
    identity_approved: 'CompleteRegistration',
    event_apply_start: 'PlaceAnOrder',
    event_apply_complete: 'CompletePayment',
  };
  window.ttq.track(map[event] ?? event, params);
}

/** Unified client tracking. No-ops when pixel IDs are unset. */
export function track(event: AnalyticsEventName, payload?: AnalyticsPayload) {
  if (typeof window === 'undefined') return;
  const params = sanitize(payload);
  try {
    pushDataLayer(event, params);
    trackGa(event, params);
    trackMeta(event, params);
    trackTikTok(event, params);
  } catch {
    // Tracking must never break product UX.
  }
}

/** Fire at most once per browser tab session for the given key. */
export function trackOnce(key: string, event: AnalyticsEventName, payload?: AnalyticsPayload) {
  if (typeof window === 'undefined') return;
  try {
    const storageKey = `${ONCE_PREFIX}${key}`;
    if (window.sessionStorage.getItem(storageKey) === '1') return;
    window.sessionStorage.setItem(storageKey, '1');
  } catch {
    // ignore storage failures
  }
  track(event, payload);
}
