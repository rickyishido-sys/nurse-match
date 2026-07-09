import {
  EVENT_CATEGORY_META,
  INTEREST_TAG_LABEL,
} from '@/lib/connection/data';
import type { ConnectionEvent, ConnectionEventCategory, ConnectionMember } from '@/lib/connection/types';

export type TimelineStep = { time: string; label: string };

export type ParticipantPreviewCard = {
  id: string;
  ageBand: string;
  traits: string[];
  tag: '初参加' | 'リピーター';
};

const EXPERIENCE_TAGLINE: Record<ConnectionEventCategory, string> = {
  flower: '花を囲みながら、普段出会えない人とゆっくり話せる体験です。',
  coffee: 'カフェの心地よい空間で、新しい人との会話が生まれる体験です。',
  business: '食卓を囲みながら、普段出会えない人とゆっくり話せる体験です。',
  walking: '街を歩きながら、自然な会話でつながれる体験です。',
  fitness: '体を動かしながら、気軽に話せる体験です。',
  learning: '学びを通じて、新しい視点と出会いが広がる体験です。',
  bar: 'リラックスした雰囲気で、本音の会話が生まれる体験です。',
  sports: '共通の体験を通じて、自然に打ち解けられる場です。',
  workshop: 'つくる時間の中で、創造と対話が重なる体験です。',
  other: '体験を通じて、知らない人とゆっくりつながれる場です。',
};

const CATEGORY_RECOMMEND: Partial<Record<ConnectionEventCategory, string[]>> = {
  flower: ['花が好き'],
  coffee: ['カフェが好き'],
  business: ['食事しながら話したい'],
  walking: ['散歩が好き'],
  fitness: ['体を動かすのが好き'],
  bar: ['気軽に話したい'],
  workshop: ['ものづくりが好き'],
};

const PLACEHOLDER_PARTICIPANTS: ParticipantPreviewCard[] = [
  { id: 'p1', ageBand: '30代', traits: ['経営者', '花好き'], tag: '初参加' },
  { id: 'p2', ageBand: '20代', traits: ['デザイナー', '読書好き'], tag: '初参加' },
  { id: 'p3', ageBand: '40代', traits: ['会社員', 'カフェ好き'], tag: 'リピーター' },
];

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

function addMinutes(date: Date, mins: number): Date {
  return new Date(date.getTime() + mins * 60_000);
}

export function getExperienceTagline(event: ConnectionEvent): string {
  return EXPERIENCE_TAGLINE[event.category] ?? EVENT_CATEGORY_META[event.category].tagline;
}

export function buildEventTimeline(startAt: string): TimelineStep[] {
  const start = new Date(startAt);
  const offsets = [
    { offset: 0, label: '受付' },
    { offset: 10, label: '自己紹介' },
    { offset: 30, label: 'Connection Time' },
    { offset: 80, label: '自由交流' },
    { offset: 120, label: '終了' },
  ];
  return offsets.map(({ offset, label }) => ({
    time: formatTime(addMinutes(start, offset)),
    label,
  }));
}

export function getRecommendedFor(event: ConnectionEvent): string[] {
  const items = ['新しい人と話したい', '一人参加歓迎', '趣味友が欲しい'];
  const extra = CATEGORY_RECOMMEND[event.category] ?? [];
  if (event.capacity <= 8) items.push('少人数でじっくり話したい');
  return [...new Set([...items, ...extra])];
}

function ageBand(age: number): string {
  if (age < 20) return '10代';
  if (age < 30) return '20代';
  if (age < 40) return '30代';
  if (age < 50) return '40代';
  if (age < 60) return '50代';
  return '60代以上';
}

export function anonymizeParticipants(members: ConnectionMember[]): ParticipantPreviewCard[] {
  if (members.length === 0) return PLACEHOLDER_PARTICIPANTS;

  return members.slice(0, 6).map((m, i) => {
    const traits: string[] = [];
    if (m.occupation?.trim()) traits.push(m.occupation.trim());
    for (const tag of m.interestTags.slice(0, 2)) {
      const label = INTEREST_TAG_LABEL[tag];
      if (label && !traits.includes(label)) traits.push(label);
    }
    if (traits.length === 0 && m.purposes[0]) traits.push('新しい出会い');
    return {
      id: `preview-${i}`,
      ageBand: m.age ? ageBand(m.age) : '—',
      traits: traits.slice(0, 3),
      tag: i % 3 === 2 ? 'リピーター' : '初参加',
    };
  });
}

export function getGalleryImages(event: ConnectionEvent): string[] {
  const uploaded = (event.imageUrls ?? []).filter(Boolean);
  if (uploaded.length > 0) return uploaded;

  const categoryHero: Partial<Record<ConnectionEventCategory, string>> = {
    flower: '/hero/desktop/flower.png',
    coffee: '/hero/desktop/cafe.png',
    business: '/hero/desktop/bar.png',
    walking: '/hero/desktop/Stroll.png',
    fitness: '/hero/desktop/fitness.png',
    bar: '/hero/desktop/bar.png',
  };

  const primary = categoryHero[event.category] ?? '/hero/desktop/cafe.png';
  return [primary, '/hero/desktop/flower.png', '/hero/desktop/cafe.png', '/hero/desktop/Stroll.png'];
}
