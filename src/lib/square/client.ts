import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';
import { getSquareConfig } from '@/lib/square/config';

const SQUARE_API_BASE: Record<'sandbox' | 'production', string> = {
  sandbox: 'https://connect.squareupsandbox.com',
  production: 'https://connect.squareup.com',
};

export type SquareApiError = {
  category?: string;
  code?: string;
  detail?: string;
  field?: string;
};

async function squareFetch<T>(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {},
): Promise<{ ok: true; data: T } | { ok: false; status: number; errors: SquareApiError[] }> {
  const config = getSquareConfig();
  if (!config.accessToken) {
    return { ok: false, status: 503, errors: [{ code: 'NOT_CONFIGURED', detail: 'Square access token missing' }] };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.accessToken}`,
    'Content-Type': 'application/json',
    'Square-Version': '2024-12-18',
    ...(init.headers as Record<string, string>),
  };
  if (init.idempotencyKey) {
    headers['Idempotency-Key'] = init.idempotencyKey;
  }

  const res = await fetch(`${SQUARE_API_BASE[config.environment]}${path}`, {
    ...init,
    headers,
  });

  const body = (await res.json().catch(() => ({}))) as { errors?: SquareApiError[] } & T;
  if (!res.ok) {
    return { ok: false, status: res.status, errors: body.errors ?? [{ detail: res.statusText }] };
  }
  return { ok: true, data: body };
}

export async function createSquareCustomer(input: {
  idempotencyKey: string;
  referenceId: string;
  givenName?: string;
  emailAddress?: string;
}) {
  return squareFetch<{ customer?: { id?: string } }>('/v2/customers', {
    method: 'POST',
    idempotencyKey: input.idempotencyKey,
    body: JSON.stringify({
      idempotency_key: input.idempotencyKey,
      given_name: input.givenName,
      email_address: input.emailAddress,
      reference_id: input.referenceId,
    }),
  });
}

export async function createSquareCard(input: {
  idempotencyKey: string;
  sourceId: string;
  customerId: string;
  verificationToken?: string;
}) {
  return squareFetch<{ card?: Record<string, unknown> }>('/v2/cards', {
    method: 'POST',
    idempotencyKey: input.idempotencyKey,
    body: JSON.stringify({
      idempotency_key: input.idempotencyKey,
      source_id: input.sourceId,
      verification_token: input.verificationToken,
      card: { customer_id: input.customerId },
    }),
  });
}

export async function createSquarePayment(input: {
  idempotencyKey: string;
  sourceId: string;
  customerId: string;
  amountJpy: number;
  referenceId: string;
  note: string;
}) {
  return squareFetch<{ payment?: Record<string, unknown> }>('/v2/payments', {
    method: 'POST',
    idempotencyKey: input.idempotencyKey,
    body: JSON.stringify({
      idempotency_key: input.idempotencyKey,
      source_id: input.sourceId,
      customer_id: input.customerId,
      location_id: getSquareConfig().locationId,
      reference_id: input.referenceId,
      note: input.note,
      autocomplete: true,
      amount_money: {
        amount: input.amountJpy,
        currency: 'JPY',
      },
    }),
  });
}

export async function refundSquarePayment(input: {
  idempotencyKey: string;
  paymentId: string;
  amountJpy: number;
  reason?: string;
}) {
  return squareFetch<{ refund?: Record<string, unknown> }>('/v2/refunds', {
    method: 'POST',
    idempotencyKey: input.idempotencyKey,
    body: JSON.stringify({
      idempotency_key: input.idempotencyKey,
      payment_id: input.paymentId,
      amount_money: { amount: input.amountJpy, currency: 'JPY' },
      reason: input.reason ?? 'Event cancelled',
    }),
  });
}

export async function getSquarePayment(paymentId: string) {
  return squareFetch<{ payment?: Record<string, unknown> }>(`/v2/payments/${paymentId}`, {
    method: 'GET',
  });
}

export async function disableSquareCard(cardId: string) {
  return squareFetch<{ card?: Record<string, unknown> }>(`/v2/cards/${cardId}/disable`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function verifySquareWebhookSignature(rawBody: string, signatureHeader: string | null, notificationUrl: string): boolean {
  const { webhookSignatureKey } = getSquareConfig();
  if (!webhookSignatureKey || !signatureHeader) return false;

  const payload = notificationUrl + rawBody;
  const expected = createHmac('sha256', webhookSignatureKey).update(payload).digest('base64');

  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function mapSquareFailureMessage(code?: string): string {
  switch (code) {
    case 'CARD_DECLINED':
      return 'カードが拒否されました。別のカードをお試しください。';
    case 'INSUFFICIENT_FUNDS':
      return '残高が不足しています。';
    case 'CVV_FAILURE':
      return 'セキュリティコードが正しくありません。';
    case 'INVALID_EXPIRATION':
      return '有効期限が正しくありません。';
    case 'CARD_TOKEN_USED':
      return 'カード情報の有効期限が切れました。再度入力してください。';
    default:
      return '決済を完了できませんでした。カード情報をご確認ください。';
  }
}
