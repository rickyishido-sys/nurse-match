import { unstable_cache } from 'next/cache';
import { listEvents } from '@/lib/connection/repo';

/** イベント一覧 API — 60秒キャッシュ */
export const listEventsCached = unstable_cache(
  async () => listEvents(),
  ['hanakai-events-list'],
  { revalidate: 60, tags: ['hanakai-events'] },
);
