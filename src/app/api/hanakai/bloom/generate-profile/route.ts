import { NextResponse } from 'next/server';
import { generateBloomProfileForMember, isBloomAiEnabled } from '@/lib/connection/bloom-profile-ai';
import { saveGeneratedBloomProfile } from '@/lib/connection/bloom-profile';
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
    const generated = await generateBloomProfileForMember(member);
    const saved = await saveGeneratedBloomProfile(memberId, generated);
    return NextResponse.json({ ok: true, profile: saved });
  } catch (e) {
    console.error('BLOOM_PROFILE_GENERATE_ROUTE_FAILED', { memberId, error: String(e) });
    return NextResponse.json({ ok: false, error: 'generation_failed' }, { status: 500 });
  }
}
