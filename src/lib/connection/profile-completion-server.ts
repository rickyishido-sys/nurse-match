import 'server-only';

import { listApplications } from '@/lib/connection/repo';
import { listBloomTimeline } from '@/lib/connection/bloom-phase4';

export async function memberHasEventParticipation(memberId: string): Promise<boolean> {
  const apps = await listApplications();
  const confirmed = apps.filter((a) => a.memberId === memberId && a.status === 'confirmed').length;
  if (confirmed > 0) return true;

  const timeline = await listBloomTimeline(memberId);
  return timeline.some((e) => e.type === 'event_joined');
}
