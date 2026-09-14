'use client';

import { useEffect } from 'react';
import { track, trackOnce } from '@/lib/analytics/track';
import type { AnalyticsEventName, AnalyticsPayload } from '@/lib/analytics/events';

export function TrackPageEvent({
  event,
  payload,
  onceKey,
}: {
  event: AnalyticsEventName;
  payload?: AnalyticsPayload;
  onceKey?: string;
}) {
  useEffect(() => {
    if (onceKey) trackOnce(onceKey, event, payload);
    else track(event, payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, onceKey]);

  return null;
}
