import 'server-only';

import { listApplicationsForMember } from '@/lib/connection/repo';
import { listBloomTimeline } from '@/lib/connection/bloom-phase4';

/** Member-scoped participation check — never scan all applications. */
export async function memberHasEventParticipation(memberId: string): Promise<boolean> {
  const [apps, timeline] = await Promise.all([
    listApplicationsForMember(memberId),
    listBloomTimeline(memberId),
  ]);
  if (apps.some((a) => a.status === 'confirmed')) return true;
  return timeline.some((e) => e.type === 'event_joined');
}
