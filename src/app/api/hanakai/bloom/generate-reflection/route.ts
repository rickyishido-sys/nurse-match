import { NextResponse } from 'next/server';
import { getBloomProfileOrEmpty } from '@/lib/connection/bloom-profile';
import {
  getBloomPhase4Settings,
  listBloomMemories,
  listBloomTimeline,
  saveAiReflection,
} from '@/lib/connection/bloom-phase4';
import { generateAiReflection, isBloomAiEnabled } from '@/lib/connection/bloom-reflection-ai';
import { getViewerMemberId } from '@/lib/connection/identity';

export async function POST() {
  const memberId = await getViewerMemberId();
  if (!memberId) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const memories = await listBloomMemories(memberId);
  if (memories.length === 0) {
    return NextResponse.json({ ok: false, error: 'no_memories' }, { status: 400 });
  }

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
    } catch (e) {
      console.error('BLOOM_REFLECTION_GENERATE_FAILED', { memberId, error: String(e) });
      return NextResponse.json({ ok: false, error: 'generation_failed' }, { status: 500 });
    }
  } else {
    reflection = `最近のConnectionで印象に残ったことが${memories.length}件記録されているようです。様々な出会いを通じて、あなたらしさが少しずつ育っている印象があります。`;
  }

  await saveAiReflection(memberId, reflection);
  const settings = await getBloomPhase4Settings(memberId);

  return NextResponse.json({
    ok: true,
    reflection,
    showReflection: settings.showReflection,
  });
}
