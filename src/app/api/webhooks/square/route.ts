import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { syncSquarePaymentFromWebhook } from '@/lib/connection/participation-payment';
import { verifySquareWebhookSignature } from '@/lib/square/client';
import { getSquareConfig } from '@/lib/square/config';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-square-hmacsha256-signature');
  const config = getSquareConfig();
  const notificationUrl = config.webhookNotificationUrl || request.url;

  if (!verifySquareWebhookSignature(rawBody, signature, notificationUrl)) {
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 });
  }

  let payload: {
    event_id?: string;
    type?: string;
    data?: { object?: { payment?: { id?: string; status?: string }; refund?: { payment_id?: string } } };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 });
  }

  const squareEventId = payload.event_id ?? '';
  if (!squareEventId) {
    return NextResponse.json({ ok: false, error: 'Missing event id' }, { status: 400 });
  }

  const { data: existing } = await admin
    .from('hanakai_square_webhook_events')
    .select('id, status')
    .eq('square_event_id', squareEventId)
    .maybeSingle();

  if (existing?.status === 'processed') {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  if (!existing) {
    await admin.from('hanakai_square_webhook_events').insert({
      square_event_id: squareEventId,
      event_type: payload.type ?? 'unknown',
      square_object_id:
        payload.data?.object?.payment?.id ?? payload.data?.object?.refund?.payment_id ?? null,
      payload: JSON.parse(rawBody),
      status: 'received',
    });
  }

  try {
    const type = payload.type ?? '';
    if (type.startsWith('payment.')) {
      const paymentId = payload.data?.object?.payment?.id;
      if (paymentId) {
        await syncSquarePaymentFromWebhook(paymentId);
      }
    }
    await admin
      .from('hanakai_square_webhook_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('square_event_id', squareEventId);
  } catch (err) {
    await admin
      .from('hanakai_square_webhook_events')
      .update({
        status: 'failed',
        failure_message: err instanceof Error ? err.message : 'processing failed',
        processed_at: new Date().toISOString(),
      })
      .eq('square_event_id', squareEventId);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
