import { NextResponse } from 'next/server';
import { processRevenueReportReminders } from '@/lib/connection/event-operations/repo';

export const dynamic = 'force-dynamic';

/** 売上報告リマインド（12h / 24h）— cron または手動トリガー用 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET ?? process.env.HANAKAI_CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const sent = await processRevenueReportReminders();
  return NextResponse.json({ ok: true, sent });
}
