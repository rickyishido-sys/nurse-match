import type { ConnectionEventCategory } from '@/lib/connection/types';

export type EventsListFilterSlug =
  | ''
  | 'flower'
  | 'coffee'
  | 'walking'
  | 'business'
  | 'fitness'
  | 'social';

export const EVENTS_LIST_FILTERS: {
  slug: EventsListFilterSlug;
  label: string;
  emoji: string;
  categories: ConnectionEventCategory[] | null;
}[] = [
  { slug: '', label: 'すべて', emoji: '✿', categories: null },
  { slug: 'flower', label: '花', emoji: '🌸', categories: ['flower'] },
  { slug: 'coffee', label: 'コーヒー', emoji: '☕', categories: ['coffee'] },
  { slug: 'walking', label: '散歩', emoji: '🍃', categories: ['walking'] },
  { slug: 'business', label: '食事', emoji: '🍽️', categories: ['business'] },
  { slug: 'fitness', label: '運動', emoji: '🤸', categories: ['fitness'] },
  {
    slug: 'social',
    label: '交流',
    emoji: '💬',
    categories: ['learning', 'bar', 'sports', 'workshop', 'other'],
  },
];

export function filterEventsBySlug<T extends { category: ConnectionEventCategory }>(
  events: T[],
  slug: EventsListFilterSlug,
): T[] {
  const filter = EVENTS_LIST_FILTERS.find((f) => f.slug === slug);
  if (!filter?.categories) return events;
  return events.filter((e) => filter.categories!.includes(e.category));
}

export function parseEventsListFilter(raw: string | undefined): EventsListFilterSlug {
  const allowed = new Set(EVENTS_LIST_FILTERS.map((f) => f.slug));
  if (raw && allowed.has(raw as EventsListFilterSlug)) return raw as EventsListFilterSlug;
  return '';
}
