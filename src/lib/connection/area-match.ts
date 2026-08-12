import { PREFECTURES } from '@/lib/connection/onboarding-options';

const PREFECTURE_SET = new Set<string>(PREFECTURES);

/** Strip 都 / 道 / 府 / 県 suffix for fuzzy matching (東京 ↔ 東京都). */
export function stripPrefectureSuffix(name: string): string {
  const t = name.trim();
  if (t === '北海道') return '北海道';
  if (t.endsWith('都') || t.endsWith('府') || t.endsWith('県')) return t.slice(0, -1);
  return t;
}

/**
 * Normalize free-text member/event area into a canonical PREFECTURES value when possible.
 * Examples: "東京" → "東京都", "神奈川・横浜" → "神奈川県", "東京都" → "東京都"
 */
export function resolvePrefectureLabel(raw: string | null | undefined): string | null {
  const text = (raw ?? '').trim();
  if (!text || text === '海外・その他') return null;

  if (PREFECTURE_SET.has(text)) return text;

  // Exact short-name match (東京 → 東京都)
  for (const pref of PREFECTURES) {
    if (pref === '海外・その他') continue;
    if (stripPrefectureSuffix(pref) === text) return pref;
  }

  // Free-text event areas like "東京・南青山" / "神奈川・横浜"
  for (const pref of PREFECTURES) {
    if (pref === '海外・その他') continue;
    const short = stripPrefectureSuffix(pref);
    if (text.startsWith(pref) || text.startsWith(`${short}・`) || text.startsWith(`${short} `)) {
      return pref;
    }
    if (text.includes(pref)) return pref;
  }

  // Contained short name with word-ish boundary (avoid 三重 in unrelated strings as much as practical)
  for (const pref of PREFECTURES) {
    if (pref === '海外・その他') continue;
    const short = stripPrefectureSuffix(pref);
    if (short.length >= 2 && text.includes(short)) return pref;
  }

  return null;
}

export function eventMatchesPrefecture(
  eventArea: string | null | undefined,
  prefectureLabel: string | null | undefined,
): boolean {
  const target = resolvePrefectureLabel(prefectureLabel);
  if (!target) return false;
  const eventPref = resolvePrefectureLabel(eventArea);
  if (eventPref && eventPref === target) return true;

  const area = (eventArea ?? '').trim();
  if (!area) return false;
  const short = stripPrefectureSuffix(target);
  return area.includes(target) || area.includes(short);
}

export type EventsRegionScope = 'local' | 'all' | string;

export function parseEventsRegionParam(
  raw: string | undefined,
  memberArea: string | null | undefined,
): { scope: 'local' | 'all' | 'prefecture'; prefecture: string | null } {
  const memberPref = resolvePrefectureLabel(memberArea);

  if (!raw || raw === 'local') {
    if (memberPref) return { scope: 'local', prefecture: memberPref };
    return { scope: 'all', prefecture: null };
  }
  if (raw === 'all' || raw === 'national') {
    return { scope: 'all', prefecture: null };
  }

  const selected = resolvePrefectureLabel(raw) ?? (PREFECTURE_SET.has(raw) ? raw : null);
  if (selected) return { scope: 'prefecture', prefecture: selected };
  if (memberPref) return { scope: 'local', prefecture: memberPref };
  return { scope: 'all', prefecture: null };
}

export function partitionEventsByPrefecture<T extends { area: string }>(
  events: T[],
  prefecture: string | null,
): { local: T[]; other: T[] } {
  if (!prefecture) return { local: [], other: events };
  const local: T[] = [];
  const other: T[] = [];
  for (const event of events) {
    if (eventMatchesPrefecture(event.area, prefecture)) local.push(event);
    else other.push(event);
  }
  return { local, other };
}
