import 'server-only';

import { getBloomProfilesByIds } from '@/lib/connection/bloom-profile';
import { isIdentityVerified } from '@/lib/connection/trust';
import { EVENT_CATEGORY_META } from '@/lib/connection/data';
import { anonymizeParticipants, getExperienceTagline } from '@/lib/connection/event-detail-ux';
import { getMembersByIds, listApplicationsForMember } from '@/lib/connection/repo';
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

async function loadMembersByIds(ids: string[]): Promise<Map<string, ConnectionMember>> {
  const unique = [...new Set(ids.filter(Boolean))];
  // One batched members+photos query (no per-id getMember / social for chips).
  const members = await getMembersByIds(unique, { includeSocial: false });
  return new Map(members.map((m) => [m.id, m]));
}

/**
 * Enrich events for list cards with batched host/bloom/viewer-app/chip loads.
 * Avoids per-event getEventMembers + getApplication N+1.
 */
export async function enrichEventsForList(
  events: ConnectionEvent[],
  viewerMemberId?: string | null,
): Promise<EnrichedEventListItem[]> {
  if (events.length === 0) return [];

  const hostIds = [...new Set(events.map((e) => e.hostId).filter((id): id is string => Boolean(id)))];
  const chipIds = [
    ...new Set(events.flatMap((e) => (e.confirmedMemberIds ?? []).slice(0, 6))),
  ];

  const [hostMap, bloomMap, viewerApps, chipMap] = await Promise.all([
    loadMembersByIds(hostIds),
    getBloomProfilesByIds(hostIds),
    viewerMemberId ? listApplicationsForMember(viewerMemberId) : Promise.resolve([]),
    loadMembersByIds(chipIds),
  ]);
  const viewerAppByEvent = new Map(
    viewerApps.map((a) => [a.eventId, a.status] as const),
  );

  return events.map((event) => {
    const host = event.hostId ? hostMap.get(event.hostId) ?? null : null;
    const bloom = event.hostId ? bloomMap.get(event.hostId) ?? null : null;
    const confirmed = (event.confirmedMemberIds ?? [])
      .map((id) => chipMap.get(id))
      .filter((m): m is ConnectionMember => Boolean(m));
    const cards = anonymizeParticipants(confirmed);
    const joinedCount = Math.max(
      event.reservedCount ?? 0,
      event.confirmedMemberIds?.length ?? 0,
      confirmed.length,
    );
    const remainingSeats = Math.max(0, event.capacity - joinedCount);
    const meta = EVENT_CATEGORY_META[event.category];

    const hostTagline =
      bloom?.bloomSummaryTitle?.trim() ||
      bloom?.bloomSummary?.trim()?.slice(0, 72) ||
      host?.bio?.trim()?.slice(0, 72) ||
      '心地よい場で、知らない人同士が自然につながる時間を届けます。';

    return {
      event,
      host,
      catchCopy: meta.tagline,
      hostTagline,
      hostVerified: host ? isIdentityVerified(host) : false,
      experienceLine: getExperienceTagline(event),
      participantChips: aggregateParticipantChips(cards),
      participantIsPlaceholder: (event.confirmedMemberIds?.length ?? 0) === 0,
      joinedCount,
      remainingSeats,
      isSmallGroup: event.capacity <= 8,
      viewerApplicationStatus: viewerMemberId
        ? (viewerAppByEvent.get(event.id) ?? null)
        : null,
    };
  });
}

/** @deprecated Prefer enrichEventsForList (batched). Kept for single-card callers. */
export async function enrichEventForList(
  event: ConnectionEvent,
  viewerMemberId?: string | null,
): Promise<EnrichedEventListItem> {
  const [item] = await enrichEventsForList([event], viewerMemberId);
  return item;
}
