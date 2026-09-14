import 'server-only';

import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listBloomTimeline } from '@/lib/connection/bloom-phase4';

/** Member-scoped participation check — existence only (no full apps / timeline payload). */
export const memberHasEventParticipation = cache(async function memberHasEventParticipation(
  memberId: string,
): Promise<boolean> {
  const sb = await createServerSupabaseClient();
  if (!sb) {
    const timeline = await listBloomTimeline(memberId);
    return timeline.some((e) => e.type === 'event_joined');
  }

  const { data: confirmed } = await sb
    .from('hanakai_event_applications')
    .select('id')
    .eq('member_id', memberId)
    .eq('status', 'confirmed')
    .limit(1);
  if (confirmed?.length) return true;

  const { data: joined } = await sb
    .from('hanakai_bloom_timeline')
    .select('id')
    .eq('member_id', memberId)
    .eq('type', 'event_joined')
    .limit(1);

  return Boolean(joined?.length);
});
