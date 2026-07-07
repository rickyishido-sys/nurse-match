'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { INTEREST_TAG_LABEL } from '@/lib/connection/data';
import { getBloomProfileOrEmpty } from '@/lib/connection/bloom-profile';
import {
  addBloomTimelineEntry,
  getBloomPhase4Settings,
  listBloomMemories,
  listBloomTimeline,
  saveAiReflection,
  saveBloomMemory,
  saveBloomPhase4Visibility,
} from '@/lib/connection/bloom-phase4';
import type { BloomMemory, BloomVisibility } from '@/lib/connection/bloom-phase4-types';
import { generateAiReflection, isBloomAiEnabled } from '@/lib/connection/bloom-reflection-ai';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getEvent } from '@/lib/connection/repo';
import type { InterestTag } from '@/lib/connection/types';

function buildFallbackReflection(memories: BloomMemory[]): string {
  if (memories.length === 0) return '';
  return `最近のConnectionで印象に残ったことが${memories.length}件記録されているようです。様々な出会いを通じて、あなたらしさが少しずつ育っている印象があります。`;
}

async function refreshAiReflection(memberId: string): Promise<void> {
  const memories = await listBloomMemories(memberId);
  if (memories.length === 0) return;

  const timeline = await listBloomTimeline(memberId);
  const profile = await getBloomProfileOrEmpty(memberId);

  let reflection = '';
  if (isBloomAiEnabled()) {
    try {
      reflection = await generateAiReflection({
        memories: memories.slice(0, 8),
        recentTimelineTitles: timeline.slice(0, 8).map((t) => t.title),
        currentSummary: profile.bloomSummary,
      });
    } catch {
      reflection = buildFallbackReflection(memories);
    }
  } else {
    reflection = buildFallbackReflection(memories);
  }

  if (reflection.trim()) await saveAiReflection(memberId, reflection);
}

export async function saveBloomMemoryAction(formData: FormData) {
  const memberId = await getViewerMemberId();
  if (!memberId) redirect('/login');

  const eventId = String(formData.get('eventId') ?? '').trim();
  const memory = String(formData.get('memory') ?? '');
  const visibility = (formData.get('visibility') === 'public' ? 'public' : 'private') as BloomVisibility;
  const returnTo = String(formData.get('returnTo') ?? 'connection').trim();

  if (!eventId) redirect('/connections');

  await saveBloomMemory({ memberId, eventId, memory, visibility });

  const event = await getEvent(eventId);
  await addBloomTimelineEntry({
    memberId,
    type: 'memory_added',
    title: 'Bloom Memoryを記録しました',
    description: event?.title ?? null,
    visibility,
    eventId,
  });

  await refreshAiReflection(memberId);

  revalidatePath('/my-profile');
  revalidatePath(`/profile/${memberId}`);
  revalidatePath(`/connections/${eventId}`);

  if (returnTo === 'profile') {
    redirect('/my-profile?memorySaved=1');
  }
  redirect(`/connections/${eventId}?memorySaved=1`);
}

export async function skipBloomMemoryPromptAction(formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '').trim();
  if (!eventId) redirect('/connections');

  const jar = await cookies();
  jar.set(`bloom_memory_skip_${eventId}`, '1', {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  });

  redirect(`/connections/${eventId}`);
}

export async function updatePhase4VisibilityAction(formData: FormData) {
  const memberId = await getViewerMemberId();
  if (!memberId) redirect('/login?next=/my-profile');

  await saveBloomPhase4Visibility(memberId, {
    showTimeline: formData.get('showTimeline') === '1',
    showMemories: formData.get('showMemories') === '1',
    showReflection: formData.get('showReflection') === '1',
  });

  revalidatePath('/my-profile');
  revalidatePath(`/profile/${memberId}`);
  redirect('/my-profile?phase4Saved=1');
}

export async function recordProfileChangeTimeline(
  memberId: string,
  before: { bio: string; interestTags: InterestTag[] },
  after: { bio: string; interestTags: InterestTag[] },
): Promise<void> {
  if (before.bio.trim() !== after.bio.trim() && after.bio.trim()) {
    await addBloomTimelineEntry({
      memberId,
      type: 'bio_updated',
      title: '自己紹介を更新しました',
      visibility: 'public',
    });
  }

  const prev = new Set(before.interestTags);
  for (const tag of after.interestTags) {
    if (!prev.has(tag)) {
      const label = INTEREST_TAG_LABEL[tag] ?? tag;
      await addBloomTimelineEntry({
        memberId,
        type: 'interest_added',
        title: `新しい興味「${label}」を追加しました`,
        visibility: 'public',
      });
    }
  }
}

export async function refreshBloomReflectionAction() {
  const memberId = await getViewerMemberId();
  if (!memberId) redirect('/login?next=/my-profile');

  await refreshAiReflection(memberId);
  revalidatePath('/my-profile');
  revalidatePath(`/profile/${memberId}`);
  redirect('/my-profile?reflectionUpdated=1');
}

export async function getBloomMemorySkipCookie(eventId: string): Promise<boolean> {
  const jar = await cookies();
  return jar.get(`bloom_memory_skip_${eventId}`)?.value === '1';
}
