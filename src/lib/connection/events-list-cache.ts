import { listEvents } from '@/lib/connection/repo';

/** イベント一覧。動的ルートでは cookies 経由の Supabase 読み取りのため unstable_cache は使わない。 */
export async function listEventsCached() {
  return listEvents();
}
