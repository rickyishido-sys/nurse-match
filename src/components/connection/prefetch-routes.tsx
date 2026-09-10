'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Warm the App Router cache for likely next taps (past event detail, profiles).
 * Keep the list small to avoid Production load spikes.
 */
export function PrefetchRoutes({ hrefs }: { hrefs: string[] }) {
  const router = useRouter();
  const key = [...new Set(hrefs.filter(Boolean))].slice(0, 12).sort().join('\n');

  useEffect(() => {
    if (!key) return;
    for (const href of key.split('\n')) {
      try {
        router.prefetch(href);
      } catch {
        // ignore
      }
    }
  }, [key, router]);

  return null;
}
