#!/usr/bin/env node
/**
 * Create a Square SANDBOX Webhook Subscription and reflect the signature key.
 * - Uses SQUARE_ACCESS_TOKEN from .env.square.preview.local (sandbox only).
 * - Minimal event types matched to real code: payment.created, payment.updated
 *   (webhook route.ts only processes type.startsWith('payment.')).
 * - Writes SQUARE_WEBHOOK_SIGNATURE_KEY + SQUARE_WEBHOOK_NOTIFICATION_URL to
 *   .env.square.preview.local, and pushes both to Vercel Preview branch env.
 * - NEVER logs the signature key (redacted).
 *
 * Usage: node scripts/setup-square-webhook-subscription.mjs [notificationUrl]
 */
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BRANCH = 'feature/hanakai-square-payments';
const SQUARE_VERSION = '2024-12-18';
const EVENT_TYPES = ['payment.created', 'payment.updated'];
const SUB_NAME = 'hanakai-preview-yyaz';

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const env = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (v) env[t.slice(0, i).trim()] = v;
  }
  return env;
}

const squarePath = path.join(root, '.env.square.preview.local');
const fileEnv = loadEnvFile(squarePath);
const val = (k) => process.env[k] || fileEnv[k] || '';

const accessToken = val('SQUARE_ACCESS_TOKEN');
const environment =
  (val('SQUARE_ENVIRONMENT') || val('NEXT_PUBLIC_SQUARE_ENVIRONMENT') || 'sandbox').toLowerCase();
const notificationUrl =
  (process.argv[2] || val('SQUARE_WEBHOOK_NOTIFICATION_URL') ||
    'https://nurse-match-beta-kwa7csozi-info-10353781s-projects.vercel.app/api/webhooks/square').replace(/\/$/, '');

const API_BASE =
  environment === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';

function redact(text, secret) {
  let out = String(text ?? '');
  if (secret) out = out.split(secret).join('[REDACTED]');
  return out;
}

async function sq(method, pathname, body) {
  const res = await fetch(`${API_BASE}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': SQUARE_VERSION,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, json };
}

function vercelEnvSet(name, value) {
  if (!value) return { name, ok: false, detail: 'empty' };
  const upd = spawnSync('vercel', ['env', 'update', name, 'preview', BRANCH, '--yes'], {
    input: value, encoding: 'utf8', cwd: root, stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (upd.status === 0) return { name, ok: true, detail: 'updated' };
  const add = spawnSync('vercel', ['env', 'add', name, 'preview', BRANCH, '--force', '--yes'], {
    input: value, encoding: 'utf8', cwd: root, stdio: ['pipe', 'pipe', 'pipe'],
  });
  return { name, ok: add.status === 0, detail: add.status === 0 ? 'added' : 'vercel_env_set_failed' };
}

function upsertEnvFile(filePath, kv) {
  let text = existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
  for (const [key, value] of Object.entries(kv)) {
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, 'm');
    text = re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`;
  }
  writeFileSync(filePath, text);
}

const report = {
  environment,
  api_base: API_BASE,
  subscription_name: SUB_NAME,
  notification_url: notificationUrl,
  event_types: EVENT_TYPES,
  square_version: SQUARE_VERSION,
  steps: {},
  signature_key_obtained: false,
  vercel: [],
  pass: false,
};

let signatureKey = '';
try {
  if (!accessToken) throw new Error('SQUARE_ACCESS_TOKEN missing');
  if (environment !== 'sandbox') throw new Error(`Refusing non-sandbox environment: ${environment}`);

  // Clean any existing subscription with the same name (fresh signature key each run)
  const list = await sq('GET', '/v2/webhooks/subscriptions?include_disabled=true');
  report.steps.list_status = list.status;
  const existing = (list.json?.subscriptions ?? []).filter((s) => s?.name === SUB_NAME);
  for (const sub of existing) {
    const del = await sq('DELETE', `/v2/webhooks/subscriptions/${sub.id}`);
    report.steps[`deleted_${sub.id.slice(0, 6)}`] = del.status;
  }

  // Create fresh subscription
  const created = await sq('POST', '/v2/webhooks/subscriptions', {
    idempotency_key: randomUUID(),
    subscription: {
      name: SUB_NAME,
      event_types: EVENT_TYPES,
      notification_url: notificationUrl,
      api_version: SQUARE_VERSION,
      enabled: true,
    },
  });
  report.steps.create_status = created.status;
  if (!created.ok) {
    report.steps.create_errors = created.json?.errors ?? created.json;
    throw new Error(`Square create subscription failed (status ${created.status})`);
  }
  const sub = created.json?.subscription ?? {};
  report.subscription_id = sub.id ?? null;
  signatureKey = sub.signature_key ?? '';
  report.signature_key_obtained = Boolean(signatureKey);
  if (!signatureKey) throw new Error('Square did not return signature_key');

  // Reflect to local env file (gitignored) + Vercel preview branch env
  upsertEnvFile(squarePath, {
    SQUARE_WEBHOOK_SIGNATURE_KEY: signatureKey,
    SQUARE_WEBHOOK_NOTIFICATION_URL: notificationUrl,
  });
  report.local_env_written = true;

  report.vercel.push(vercelEnvSet('SQUARE_WEBHOOK_SIGNATURE_KEY', signatureKey));
  report.vercel.push(vercelEnvSet('SQUARE_WEBHOOK_NOTIFICATION_URL', notificationUrl));

  report.pass =
    report.signature_key_obtained &&
    report.local_env_written &&
    report.vercel.every((v) => v.ok);
} catch (e) {
  report.error = redact(e instanceof Error ? e.message : String(e), signatureKey);
}

// Redact any accidental signature key echo
const safe = JSON.parse(redact(JSON.stringify(report), signatureKey));
console.log(JSON.stringify(safe, null, 2));
process.exit(report.pass ? 0 : 1);
