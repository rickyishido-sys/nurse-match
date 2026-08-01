import { NextResponse } from 'next/server';
import { retryParticipationPayment } from '@/lib/connection/participation-payment';
import { getViewerMemberId } from '@/lib/connection/identity';

export async function POST(request: Request) {
  const memberId = await getViewerMemberId();
  if (!memberId) {
    return NextResponse.json({ ok: false, error: 'ログインが必要です' }, { status: 401 });
  }

  const body = (await request.json()) as { paymentId?: string };
  if (!body.paymentId) {
    return NextResponse.json({ ok: false, error: '決済IDが必要です' }, { status: 400 });
  }

  const result = await retryParticipationPayment({ paymentId: body.paymentId, memberId });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
