import { NextResponse } from 'next/server';
import { expireOverdueParticipationPayments } from '@/lib/connection/participation-payment';

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET ?? process.env.HANAKAI_CRON_SECRET ?? '';
  if (!secret) return false;
  const auth = request.headers.get('authorization') ?? '';
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const result = await expireOverdueParticipationPayments(100);
  return NextResponse.json(result);
}
