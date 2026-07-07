export type BloomVisibility = 'public' | 'private';

export type BloomTimelineType =
  | 'profile_created'
  | 'event_joined'
  | 'bio_updated'
  | 'interest_added'
  | 'bloom_updated'
  | 'memory_added';

export type BloomTimelineEntry = {
  id: string;
  memberId: string;
  type: BloomTimelineType;
  title: string;
  description: string | null;
  visibility: BloomVisibility;
  eventId: string | null;
  createdAt: string;
};

export type BloomMemory = {
  id: string;
  memberId: string;
  eventId: string | null;
  eventTitle: string | null;
  memory: string;
  visibility: BloomVisibility;
  createdAt: string;
};

export type BloomVersion = {
  id: string;
  memberId: string;
  summary: string;
  summaryTitle: string;
  connectionStyle: string;
  conversationStarters: string[];
  aiTags: string[];
  createdAt: string;
};

export type BloomPhase4Profile = {
  aiReflection: string;
  showTimeline: boolean;
  showMemories: boolean;
  showReflection: boolean;
};

export type PublicBloomPhase4 = {
  timeline?: BloomTimelineEntry[];
  memories?: BloomMemory[];
  aiReflection?: string;
};

export function filterPublicTimeline(entries: BloomTimelineEntry[]): BloomTimelineEntry[] {
  return entries.filter((e) => e.visibility === 'public');
}

export function filterPublicMemories(memories: BloomMemory[]): BloomMemory[] {
  return memories.filter((m) => m.visibility === 'public');
}

export function toPublicBloomPhase4(
  data: {
    timeline: BloomTimelineEntry[];
    memories: BloomMemory[];
    aiReflection: string;
    showTimeline: boolean;
    showMemories: boolean;
    showReflection: boolean;
  },
  isOwner: boolean,
): PublicBloomPhase4 | null {
  const out: PublicBloomPhase4 = {};

  if (isOwner || data.showTimeline) {
    const items = isOwner ? data.timeline : filterPublicTimeline(data.timeline);
    if (items.length > 0) out.timeline = items;
  }
  if (isOwner || data.showMemories) {
    const items = isOwner ? data.memories : filterPublicMemories(data.memories);
    if (items.length > 0) out.memories = items;
  }
  if ((isOwner || data.showReflection) && data.aiReflection.trim()) {
    out.aiReflection = data.aiReflection;
  }

  return Object.keys(out).length > 0 ? out : null;
}
