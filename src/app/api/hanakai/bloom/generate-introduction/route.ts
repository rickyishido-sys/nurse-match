import { NextResponse } from 'next/server';
import { ensureViewerMemberId } from '@/lib/connection/identity';
import {
  generateBloomIntroductionDraft,
  isBloomAiEnabled,
  memberToBloomIntroductionInput,
} from '@/lib/connection/bloom-introduction-ai';
import { getMember } from '@/lib/connection/repo';

export async function POST() {
  if (!isBloomAiEnabled()) {
    return NextResponse.json({ ok: false, error: 'AI下書き機能は準備中です' }, { status: 503 });
  }

  const memberId = await ensureViewerMemberId();
  if (!memberId) {
    return NextResponse.json({ ok: false, error: 'ログインが必要です' }, { status: 401 });
  }

  const member = await getMember(memberId);
  if (!member) {
    return NextResponse.json({ ok: false, error: 'プロフィールが見つかりません' }, { status: 404 });
  }

  if (!member.nickname.trim()) {
    return NextResponse.json({ ok: false, error: '表示名を先に登録してください' }, { status: 400 });
  }

  try {
    const introduction = await generateBloomIntroductionDraft(memberToBloomIntroductionInput(member));
    return NextResponse.json({ ok: true, introduction });
  } catch (error) {
    console.error('BLOOM_INTRO_API_ERROR', { memberId, error: String(error) });
    return NextResponse.json({ ok: false, error: 'AI下書きの生成に失敗しました。しばらくしてからお試しください。' }, { status: 500 });
  }
}
