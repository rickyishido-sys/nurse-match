import { NextResponse } from 'next/server';
import { generateBloomProfileForMember, isBloomAiEnabled } from '@/lib/connection/bloom-profile-ai';
import { getBloomProfile, saveGeneratedBloomProfile } from '@/lib/connection/bloom-profile';
import {
  recordBloomProfileGenerated,
  snapshotBeforeBloomUpdate,
} from '@/lib/connection/bloom-phase4';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getMember } from '@/lib/connection/repo';

export async function POST() {
  if (!isBloomAiEnabled()) {
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
  }

  const memberId = await getViewerMemberId();
  if (!memberId) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const member = await getMember(memberId);
  if (!member) {
    return NextResponse.json({ ok: false, error: 'member_not_found' }, { status: 404 });
  }

  try {
    const current = await getBloomProfile(memberId);
    const isFirst = !current?.bloomSummary?.trim();
    const generated = await generateBloomProfileForMember(member);
    await snapshotBeforeBloomUpdate(memberId, current, generated);
    const saved = await saveGeneratedBloomProfile(memberId, generated);
    await recordBloomProfileGenerated(memberId, generated, isFirst);
    return NextResponse.json({ ok: true, profile: saved });
  } catch (e) {
    console.error('BLOOM_PROFILE_GENERATE_ROUTE_FAILED', { memberId, error: String(e) });
    return NextResponse.json({ ok: false, error: 'generation_failed' }, { status: 500 });
  }
}
