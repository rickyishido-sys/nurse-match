#!/usr/bin/env node
/**
 * Square webhook signature verification tests (no network, no secret logging).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

function verify(rawBody, signatureHeader, notificationUrl, webhookSignatureKey) {
  if (!webhookSignatureKey || !signatureHeader) return false;
  const expected = createHmac('sha256', webhookSignatureKey).update(notificationUrl + rawBody).digest('base64');
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function sign(body, url, key) {
  return createHmac('sha256', key).update(url + body).digest('base64');
}

const results = [];
function record(name, ok) {
  results.push({ name, ok });
  console.log(ok ? 'PASS' : 'FAIL', name);
}

const body = JSON.stringify({ event_id: 'evt_test', type: 'payment.updated' });
const url = 'https://preview.example.com/api/webhooks/square';
const key = 'test-webhook-key';

record('secret_unset', verify(body, 'sig', url, '') === false);
record('missing_signature', verify(body, null, url, key) === false);
record('invalid_signature', verify(body, 'bad', url, key) === false);
record('valid_signature', verify(body, sign(body, url, key), url, key) === true);

process.exit(results.some((r) => !r.ok) ? 1 : 0);
