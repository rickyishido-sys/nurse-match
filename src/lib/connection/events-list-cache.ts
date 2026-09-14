import { listActiveEvents } from '@/lib/connection/repo';

/** イベント一覧（開催中・予定のみ）。動的ルートでは cookies 経由のため unstable_cache は使わない。 */
export async function listEventsCached() {
  return listActiveEvents();
}
