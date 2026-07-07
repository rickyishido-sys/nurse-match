import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  EMPTY_BLOOM_PROFILE,
  type BloomProfile,
  type BloomProfileGenerated,
} from '@/lib/connection/bloom-profile-types';

function bloomFromRow(row: Record<string, unknown>): BloomProfile {
  const memberId = String(row.member_id);
  const starters = Array.isArray(row.conversation_starters)
    ? row.conversation_starters.map((s) => String(s))
    : [];
  const topics = Array.isArray(row.talk_topics) ? row.talk_topics.map((s) => String(s)) : [];
  const tags = Array.isArray(row.ai_tags) ? row.ai_tags.map((s) => String(s)) : [];

  return {
    memberId,
    aiIntroduction: String(row.ai_introduction ?? ''),
    bloomSummaryTitle: String(row.bloom_summary_title ?? ''),
    bloomSummary: String(row.bloom_summary ?? ''),
    conversationStarters: starters,
    connectionStyle: String(row.connection_style ?? ''),
    talkTopics: topics,
    aiTags: tags,
    showAiIntro: Boolean(row.show_ai_intro),
    showBloomSummary: row.show_bloom_summary !== false,
    showConversationStarters: row.show_conversation_starters !== false,
    showBloomTags: Boolean(row.show_bloom_tags),
    showConnectionStyle: row.show_connection_style !== false,
    generatedAt: row.generated_at ? String(row.generated_at) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  };
}

function toRow(
  memberId: string,
  data: Partial<BloomProfile> & Partial<BloomProfileGenerated>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { member_id: memberId };
  if (data.aiIntroduction !== undefined) out.ai_introduction = data.aiIntroduction;
  if (data.bloomSummaryTitle !== undefined) out.bloom_summary_title = data.bloomSummaryTitle;
  if (data.bloomSummary !== undefined) out.bloom_summary = data.bloomSummary;
  if (data.conversationStarters !== undefined) out.conversation_starters = data.conversationStarters;
  if (data.connectionStyle !== undefined) out.connection_style = data.connectionStyle;
  if (data.talkTopics !== undefined) out.talk_topics = data.talkTopics;
  if (data.aiTags !== undefined) out.ai_tags = data.aiTags;
  if (data.showAiIntro !== undefined) out.show_ai_intro = data.showAiIntro;
  if (data.showBloomSummary !== undefined) out.show_bloom_summary = data.showBloomSummary;
  if (data.showConversationStarters !== undefined) out.show_conversation_starters = data.showConversationStarters;
  if (data.showBloomTags !== undefined) out.show_bloom_tags = data.showBloomTags;
  if (data.showConnectionStyle !== undefined) out.show_connection_style = data.showConnectionStyle;
  if (data.generatedAt !== undefined) out.generated_at = data.generatedAt;
  return out;
}

export async function getBloomProfile(memberId: string): Promise<BloomProfile | null> {
  const sb = await createServerSupabaseClient();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('hanakai_bloom_profiles')
      .select('*')
      .eq('member_id', memberId)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01' || error.message?.includes('hanakai_bloom_profiles')) {
        console.warn('BLOOM_PROFILE_TABLE_MISSING', { memberId });
        return null;
      }
      console.warn('BLOOM_PROFILE_FETCH_SKIP', { memberId, message: error.message });
      return null;
    }
    if (!data) return null;
    return bloomFromRow(data);
  } catch (e) {
    console.warn('BLOOM_PROFILE_FETCH_FAILED', { memberId, error: String(e) });
    return null;
  }
}

export async function getBloomProfileOrEmpty(memberId: string): Promise<BloomProfile> {
  return (await getBloomProfile(memberId)) ?? EMPTY_BLOOM_PROFILE(memberId);
}

export async function upsertBloomProfile(
  memberId: string,
  data: Partial<BloomProfile> & Partial<BloomProfileGenerated>,
): Promise<BloomProfile> {
  const sb = await createServerSupabaseClient();
  if (!sb) throw new Error('Supabase client unavailable');

  const now = new Date().toISOString();
  const row = {
    ...toRow(memberId, data),
    updated_at: now,
    ...(data.generatedAt !== undefined || data.aiIntroduction !== undefined
      ? { generated_at: data.generatedAt ?? now }
      : {}),
  };

  const { data: existing } = await sb
    .from('hanakai_bloom_profiles')
    .select('member_id')
    .eq('member_id', memberId)
    .maybeSingle();

  if (existing) {
    const { error } = await sb.from('hanakai_bloom_profiles').update(row).eq('member_id', memberId);
    if (error) {
      console.error('BLOOM_PROFILE_UPDATE_FAILED', { memberId, message: error.message });
      throw new Error('Bloom Profile の保存に失敗しました');
    }
  } else {
    const { error } = await sb.from('hanakai_bloom_profiles').insert(row);
    if (error) {
      console.error('BLOOM_PROFILE_INSERT_FAILED', { memberId, message: error.message });
      throw new Error('Bloom Profile の保存に失敗しました');
    }
  }

  return (await getBloomProfile(memberId)) ?? EMPTY_BLOOM_PROFILE(memberId);
}

export async function saveBloomVisibility(
  memberId: string,
  visibility: Pick<
    BloomProfile,
    | 'showAiIntro'
    | 'showBloomSummary'
    | 'showConversationStarters'
    | 'showBloomTags'
    | 'showConnectionStyle'
  >,
): Promise<void> {
  await upsertBloomProfile(memberId, visibility);
}

export async function saveGeneratedBloomProfile(
  memberId: string,
  generated: BloomProfileGenerated,
): Promise<BloomProfile> {
  return upsertBloomProfile(memberId, {
    ...generated,
    generatedAt: new Date().toISOString(),
  });
}
