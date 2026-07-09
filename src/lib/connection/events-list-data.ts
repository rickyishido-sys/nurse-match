import 'server-only';

import { getBloomProfile } from '@/lib/connection/bloom-profile';
import { EVENT_CATEGORY_META } from '@/lib/connection/data';
import { anonymizeParticipants, getExperienceTagline } from '@/lib/connection/event-detail-ux';
import { getEventMembers, getMember, getApplication } from '@/lib/connection/repo';
import type { ConnectionEvent, ConnectionMember, EventApplicationStatus } from '@/lib/connection/types';

export type EnrichedEventListItem = {
  event: ConnectionEvent;
  host: ConnectionMember | null;
  catchCopy: string;
  hostTagline: string;
  hostVerified: boolean;
  experienceLine: string;
  participantChips: string[];
  participantIsPlaceholder: boolean;
  joinedCount: number;
  remainingSeats: number;
  isSmallGroup: boolean;
  viewerApplicationStatus?: EventApplicationStatus | null;
};

function aggregateParticipantChips(
  cards: ReturnType<typeof anonymizeParticipants>,
): string[] {
  const chips = new Set<string>();
  for (const card of cards) {
    if (card.ageBand !== '—') chips.add(card.ageBand);
    for (const trait of card.traits) chips.add(trait);
    chips.add(card.tag);
  }
  return Array.from(chips).slice(0, 8);
}

export async function enrichEventForList(
  event: ConnectionEvent,
  viewerMemberId?: string | null,
): Promise<EnrichedEventListItem> {
  const host = event.hostId ? await getMember(event.hostId) : null;
  const bloom = event.hostId ? await getBloomProfile(event.hostId) : null;
  const confirmed = await getEventMembers(event.id);
  const cards = anonymizeParticipants(confirmed);
  const joinedCount = Math.max(
    event.reservedCount,
    event.confirmedMemberIds.length,
    confirmed.length,
  );
  const remainingSeats = Math.max(0, event.capacity - joinedCount);
  const meta = EVENT_CATEGORY_META[event.category];

  const hostTagline =
    bloom?.bloomSummaryTitle?.trim() ||
    bloom?.bloomSummary?.trim()?.slice(0, 72) ||
    host?.bio?.trim()?.slice(0, 72) ||
    '心地よい場で、知らない人同士が自然につながる時間を届けます。';

  let viewerApplicationStatus = null as EventApplicationStatus | null;
  if (viewerMemberId) {
    const app = await getApplication(event.id, viewerMemberId);
    viewerApplicationStatus = app?.status ?? null;
  }

  return {
    event,
    host,
    catchCopy: meta.tagline,
    hostTagline,
    hostVerified: Boolean(host?.identityVerified),
    experienceLine: getExperienceTagline(event),
    participantChips: aggregateParticipantChips(cards),
    participantIsPlaceholder: confirmed.length === 0,
    joinedCount,
    remainingSeats,
    isSmallGroup: event.capacity <= 8,
    viewerApplicationStatus,
  };
}

export async function enrichEventsForList(
  events: ConnectionEvent[],
  viewerMemberId?: string | null,
): Promise<EnrichedEventListItem[]> {
  return Promise.all(events.map((e) => enrichEventForList(e, viewerMemberId)));
}
