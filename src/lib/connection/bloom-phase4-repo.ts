import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  BloomMemory,
  BloomTimelineEntry,
  BloomTimelineType,
  BloomVersion,
  BloomVisibility,
} from '@/lib/connection/bloom-phase4-types';
import type { BloomProfile, BloomProfileGenerated } from '@/lib/connection/bloom-profile-types';

function timelineFromRow(row: Record<string, unknown>): BloomTimelineEntry {
  return {
    id: String(row.id),
    memberId: String(row.member_id),
    type: String(row.type) as BloomTimelineType,
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    visibility: (row.visibility === 'private' ? 'private' : 'public') as BloomVisibility,
    eventId: row.event_id ? String(row.event_id) : null,
    createdAt: String(row.created_at),
  };
}

function memoryFromRow(row: Record<string, unknown>, eventTitle?: string | null): BloomMemory {
  return {
    id: String(row.id),
    memberId: String(row.member_id),
    eventId: row.event_id ? String(row.event_id) : null,
    eventTitle: eventTitle ?? null,
    memory: String(row.memory),
    visibility: (row.visibility === 'public' ? 'public' : 'private') as BloomVisibility,
    createdAt: String(row.created_at),
  };
}

function versionFromRow(row: Record<string, unknown>): BloomVersion {
  const starters = Array.isArray(row.conversation_starters)
    ? row.conversation_starters.map((s) => String(s))
    : [];
  const tags = Array.isArray(row.ai_tags) ? row.ai_tags.map((s) => String(s)) : [];
  return {
    id: String(row.id),
    memberId: String(row.member_id),
    summary: String(row.summary ?? ''),
    summaryTitle: String(row.summary_title ?? ''),
    connectionStyle: String(row.connection_style ?? ''),
    conversationStarters: starters,
    aiTags: tags,
    createdAt: String(row.created_at),
  };
}

export async function addBloomTimelineEntry(input: {
  memberId: string;
  type: BloomTimelineType;
  title: string;
  description?: string | null;
  visibility?: BloomVisibility;
  eventId?: string | null;
}): Promise<void> {
  const sb = await createServerSupabaseClient();
  if (!sb) return;

  const { error } = await sb.from('hanakai_bloom_timeline').insert({
    member_id: input.memberId,
    type: input.type,
    title: input.title,
    description: input.description ?? null,
    visibility: input.visibility ?? 'public',
    event_id: input.eventId ?? null,
  });
  if (error) console.warn('BLOOM_TIMELINE_INSERT_SKIP', { message: error.message });
}

export async function listBloomTimeline(memberId: string): Promise<BloomTimelineEntry[]> {
  const sb = await createServerSupabaseClient();
  if (!sb) return [];

  try {
    const { data, error } = await sb
      .from('hanakai_bloom_timeline')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(timelineFromRow);
  } catch {
    return [];
  }
}

export async function saveBloomMemory(input: {
  memberId: string;
  eventId: string;
  memory: string;
  visibility: BloomVisibility;
}): Promise<BloomMemory | null> {
  const sb = await createServerSupabaseClient();
  if (!sb) throw new Error('Supabase client unavailable');

  const trimmed = input.memory.trim();
  if (trimmed.length < 100 || trimmed.length > 300) {
    throw new Error('Memory must be 100-300 characters');
  }

  const { data: existing } = await sb
    .from('hanakai_bloom_memories')
    .select('id')
    .eq('member_id', input.memberId)
    .eq('event_id', input.eventId)
    .maybeSingle();

  let row;
  if (existing) {
    const { data, error } = await sb
      .from('hanakai_bloom_memories')
      .update({ memory: trimmed, visibility: input.visibility })
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) throw new Error('Memory save failed');
    row = data;
  } else {
    const { data, error } = await sb
      .from('hanakai_bloom_memories')
      .insert({
        member_id: input.memberId,
        event_id: input.eventId,
        memory: trimmed,
        visibility: input.visibility,
      })
      .select('*')
      .single();
    if (error) throw new Error('Memory save failed');
    row = data;
  }

  return memoryFromRow(row);
}

export async function getBloomMemoryForEvent(
  memberId: string,
  eventId: string,
): Promise<BloomMemory | null> {
  const sb = await createServerSupabaseClient();
  if (!sb) return null;

  const { data } = await sb
    .from('hanakai_bloom_memories')
    .select('*')
    .eq('member_id', memberId)
    .eq('event_id', eventId)
    .maybeSingle();
  return data ? memoryFromRow(data) : null;
}

export async function listBloomMemories(memberId: string): Promise<BloomMemory[]> {
  const sb = await createServerSupabaseClient();
  if (!sb) return [];

  try {
    const { data, error } = await sb
      .from('hanakai_bloom_memories')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];

    const eventIds = [...new Set(data.map((r) => r.event_id).filter(Boolean))] as string[];
    const titleMap = new Map<string, string>();
    if (eventIds.length > 0) {
      const { data: events } = await sb.from('hanakai_events').select('id, title').in('id', eventIds);
      for (const e of events ?? []) titleMap.set(String(e.id), String(e.title));
    }

    return data.map((row) =>
      memoryFromRow(row, row.event_id ? titleMap.get(String(row.event_id)) ?? null : null),
    );
  } catch {
    return [];
  }
}

export async function saveBloomVersion(memberId: string, profile: BloomProfile): Promise<void> {
  const sb = await createServerSupabaseClient();
  if (!sb) return;
  if (!profile.bloomSummary.trim() && !profile.bloomSummaryTitle.trim()) return;

  const { error } = await sb.from('hanakai_bloom_versions').insert({
    member_id: memberId,
    summary: profile.bloomSummary,
    summary_title: profile.bloomSummaryTitle,
    connection_style: profile.connectionStyle,
    conversation_starters: profile.conversationStarters,
    ai_tags: profile.aiTags,
  });
  if (error) console.warn('BLOOM_VERSION_INSERT_SKIP', { message: error.message });
}

export async function listBloomVersions(memberId: string): Promise<BloomVersion[]> {
  const sb = await createServerSupabaseClient();
  if (!sb) return [];

  try {
    const { data, error } = await sb
      .from('hanakai_bloom_versions')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(versionFromRow);
  } catch {
    return [];
  }
}

export async function saveAiReflection(memberId: string, reflection: string): Promise<void> {
  const sb = await createServerSupabaseClient();
  if (!sb) return;

  const { data: existing } = await sb
    .from('hanakai_bloom_profiles')
    .select('member_id')
    .eq('member_id', memberId)
    .maybeSingle();

  if (existing) {
    await sb.from('hanakai_bloom_profiles').update({ ai_reflection: reflection }).eq('member_id', memberId);
  } else {
    await sb.from('hanakai_bloom_profiles').insert({ member_id: memberId, ai_reflection: reflection });
  }
}

export async function getBloomPhase4Settings(memberId: string): Promise<{
  aiReflection: string;
  showTimeline: boolean;
  showMemories: boolean;
  showReflection: boolean;
}> {
  const sb = await createServerSupabaseClient();
  if (!sb) {
    return { aiReflection: '', showTimeline: true, showMemories: false, showReflection: true };
  }

  const { data } = await sb
    .from('hanakai_bloom_profiles')
    .select('ai_reflection, show_timeline, show_memories, show_reflection')
    .eq('member_id', memberId)
    .maybeSingle();

  return {
    aiReflection: String(data?.ai_reflection ?? ''),
    showTimeline: data?.show_timeline !== false,
    showMemories: Boolean(data?.show_memories),
    showReflection: data?.show_reflection !== false,
  };
}

export async function saveBloomPhase4Visibility(
  memberId: string,
  settings: { showTimeline: boolean; showMemories: boolean; showReflection: boolean },
): Promise<void> {
  const sb = await createServerSupabaseClient();
  if (!sb) throw new Error('Supabase client unavailable');

  const { data: existing } = await sb
    .from('hanakai_bloom_profiles')
    .select('member_id')
    .eq('member_id', memberId)
    .maybeSingle();

  const payload = {
    show_timeline: settings.showTimeline,
    show_memories: settings.showMemories,
    show_reflection: settings.showReflection,
  };

  if (existing) {
    await sb.from('hanakai_bloom_profiles').update(payload).eq('member_id', memberId);
  } else {
    await sb.from('hanakai_bloom_profiles').insert({ member_id: memberId, ...payload });
  }
}

export async function snapshotBeforeBloomUpdate(
  memberId: string,
  current: BloomProfile | null,
  generated: BloomProfileGenerated,
): Promise<void> {
  if (current?.bloomSummary.trim()) {
    await saveBloomVersion(memberId, current);
  }
}

export async function recordBloomProfileGenerated(
  memberId: string,
  generated: BloomProfileGenerated,
  isFirst: boolean,
): Promise<void> {
  if (isFirst) {
    await addBloomTimelineEntry({
      memberId,
      type: 'profile_created',
      title: '初めてBloom Profileを作成',
      description: generated.bloomSummaryTitle || null,
      visibility: 'public',
    });
  } else {
    await addBloomTimelineEntry({
      memberId,
      type: 'bloom_updated',
      title: 'Bloom Profileを更新しました',
      description: generated.bloomSummaryTitle || null,
      visibility: 'public',
    });
  }
}

export async function recordEventJoinedTimeline(
  memberId: string,
  eventId: string,
  eventTitle: string,
): Promise<void> {
  const sb = await createServerSupabaseClient();
  if (!sb) return;

  const { data: existing } = await sb
    .from('hanakai_bloom_timeline')
    .select('id')
    .eq('member_id', memberId)
    .eq('type', 'event_joined')
    .eq('event_id', eventId)
    .maybeSingle();

  if (existing) return;

  await addBloomTimelineEntry({
    memberId,
    type: 'event_joined',
    title: `${eventTitle} に参加`,
    visibility: 'public',
    eventId,
  });
}
