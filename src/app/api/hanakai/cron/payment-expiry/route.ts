import { NextResponse } from 'next/server';
import { expireOverdueParticipationPayments } from '@/lib/connection/participation-payment';

export const runtime = 'nodejs';

function cronSecret(): string {
  return process.env.CRON_SECRET ?? process.env.HANAKAI_CRON_SECRET ?? '';
}

/**
 * Fail-closed auth for the expiry cron. Returns an error response to send, or
 * null when the caller is authorized. The secret is never logged.
 *   - secret not configured -> 503 (fail-closed; the job must not run blindly)
 *   - missing / mismatched Bearer -> 401
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically when the
 * CRON_SECRET env var is set, so a GET request from the scheduler is authorized.
 */
function denyIfUnauthorized(request: Request): NextResponse | null {
  const secret = cronSecret();
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'Cron secret not configured' }, { status: 503 });
  }
  const auth = request.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

// DB is only touched after authorization succeeds. The underlying RPC is
// idempotent, so repeated invocations are safe.
async function runExpiry(request: Request) {
  const denied = denyIfUnauthorized(request);
  if (denied) return denied;
  const result = await expireOverdueParticipationPayments(100);
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return runExpiry(request);
}

export async function POST(request: Request) {
  return runExpiry(request);
}
