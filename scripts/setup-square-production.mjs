#!/usr/bin/env node
/**
 * PRODUCTION Square setup for HANAKAI (hanakai.kranz.design). Does three things:
 *   1. Pushes the 4 core Square vars to Vercel PRODUCTION env:
 *        NEXT_PUBLIC_SQUARE_APPLICATION_ID, NEXT_PUBLIC_SQUARE_LOCATION_ID,
 *        NEXT_PUBLIC_SQUARE_ENVIRONMENT(=production), SQUARE_ACCESS_TOKEN
 *   2. Creates a PRODUCTION webhook subscription (payment.created/updated) at
 *        https://hanakai.kranz.design/api/webhooks/square, obtains the signature
 *        key, writes it to .env.square.production.local, and sets
 *        SQUARE_WEBHOOK_SIGNATURE_KEY + SQUARE_WEBHOOK_NOTIFICATION_URL in prod.
 *   3. Generates a fresh CRON_SECRET, sets it in Vercel PRODUCTION, and records
 *        it as PROD_CRON_SECRET in .env.square.production.local (for cron tests).
 *
 * SAFETY:
 *   - Requires CONFIRM_PROD_SETUP=YES.
 *   - Refuses unless NEXT_PUBLIC_SQUARE_ENVIRONMENT === 'production'.
 *   - Never prints secrets (redacted). Env values are piped to the Vercel CLI
 *     via stdin, never via argv/shell.
 *
 * Usage: CONFIRM_PROD_SETUP=YES node scripts/setup-square-production.mjs
 */
import { spawnSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SQUARE_VERSION = '2024-12-18';
const EVENT_TYPES = ['payment.created', 'payment.updated'];
const SUB_NAME = 'hanakai-production';
const NOTIFICATION_URL = 'https://hanakai.kranz.design/api/webhooks/square';
const API_BASE = 'https://connect.squareup.com';
const squarePath = path.join(root, '.env.square.production.local');

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const env = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if (v.length > 1 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) v = v.slice(1, -1);
    if (v) env[t.slice(0, i).trim()] = v;
  }
  return env;
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

const fileEnv = loadEnvFile(squarePath);
const val = (k) => process.env[k] || fileEnv[k] || '';
const accessToken = val('SQUARE_ACCESS_TOKEN');
const environment = (val('NEXT_PUBLIC_SQUARE_ENVIRONMENT') || 'sandbox').toLowerCase();
const appId = val('NEXT_PUBLIC_SQUARE_APPLICATION_ID');
const locationId = val('NEXT_PUBLIC_SQUARE_LOCATION_ID');

const secrets = [];
function redact(text) {
  let out = String(text ?? '');
  for (const s of secrets) if (s) out = out.split(s).join('[REDACTED]');
  return out;
}

// Set a Vercel PRODUCTION env var by piping the value via stdin (never argv).
function vercelSetProd(name, value) {
  if (!value) return { name, ok: false, detail: 'empty' };
  // --force overwrites an existing var of the same target; value comes from stdin.
  const add = spawnSync('vercel', ['env', 'add', name, 'production', '--force', '--yes'], {
    input: value, cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
  });
  return { name, ok: add.status === 0, detail: add.status === 0 ? 'set' : redact((add.stderr || '').trim().slice(-160)) };
}

async function sq(method, pathname, body) {
  const res = await fetch(`${API_BASE}${pathname}`, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Square-Version': SQUARE_VERSION },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, json };
}

const report = {
  environment, api_base: API_BASE, subscription_name: SUB_NAME, notification_url: NOTIFICATION_URL,
  event_types: EVENT_TYPES, steps: {}, vercel: [], pass: false,
};
let signatureKey = '';
let cronSecret = '';

try {
  if (process.env.CONFIRM_PROD_SETUP !== 'YES') {
    report.dry_run = true; report.note = 'Set CONFIRM_PROD_SETUP=YES to apply.';
    console.log(JSON.stringify(report, null, 2)); process.exit(2);
  }
  if (environment !== 'production') throw new Error(`Refusing: NEXT_PUBLIC_SQUARE_ENVIRONMENT is '${environment}', expected 'production'`);
  if (!accessToken) throw new Error('SQUARE_ACCESS_TOKEN missing');
  if (!appId || !locationId) throw new Error('Application ID / Location ID missing');
  secrets.push(accessToken);

  // --- 1. Core Square env -> Vercel production ---------------------------
  report.vercel.push(vercelSetProd('NEXT_PUBLIC_SQUARE_APPLICATION_ID', appId));
  report.vercel.push(vercelSetProd('NEXT_PUBLIC_SQUARE_LOCATION_ID', locationId));
  report.vercel.push(vercelSetProd('NEXT_PUBLIC_SQUARE_ENVIRONMENT', 'production'));
  report.vercel.push(vercelSetProd('SQUARE_ACCESS_TOKEN', accessToken));

  // --- 2. Production webhook subscription --------------------------------
  const list = await sq('GET', '/v2/webhooks/subscriptions?include_disabled=true');
  report.steps.list_status = list.status;
  for (const sub of (list.json?.subscriptions ?? []).filter((s) => s?.name === SUB_NAME)) {
    const del = await sq('DELETE', `/v2/webhooks/subscriptions/${sub.id}`);
    report.steps[`deleted_${sub.id.slice(0, 6)}`] = del.status;
  }
  const created = await sq('POST', '/v2/webhooks/subscriptions', {
    idempotency_key: randomUUID(),
    subscription: { name: SUB_NAME, event_types: EVENT_TYPES, notification_url: NOTIFICATION_URL, api_version: SQUARE_VERSION, enabled: true },
  });
  report.steps.create_status = created.status;
  if (!created.ok) { report.steps.create_errors = created.json?.errors ?? created.json; throw new Error(`Square create subscription failed (status ${created.status})`); }
  const sub = created.json?.subscription ?? {};
  report.subscription_id = sub.id ?? null;
  signatureKey = sub.signature_key ?? '';
  if (!signatureKey) throw new Error('Square did not return signature_key');
  secrets.push(signatureKey);
  report.signature_key_obtained = true;

  report.vercel.push(vercelSetProd('SQUARE_WEBHOOK_SIGNATURE_KEY', signatureKey));
  report.vercel.push(vercelSetProd('SQUARE_WEBHOOK_NOTIFICATION_URL', NOTIFICATION_URL));

  // --- 3. CRON_SECRET ----------------------------------------------------
  cronSecret = randomBytes(32).toString('hex');
  secrets.push(cronSecret);
  report.vercel.push(vercelSetProd('CRON_SECRET', cronSecret));
  report.cron_secret_generated = true;

  // Persist non-argv secrets locally (gitignored) for verification steps.
  upsertEnvFile(squarePath, {
    SQUARE_WEBHOOK_SIGNATURE_KEY: signatureKey,
    SQUARE_WEBHOOK_NOTIFICATION_URL: NOTIFICATION_URL,
    PROD_CRON_SECRET: cronSecret,
  });
  report.local_env_written = true;

  report.pass = report.vercel.every((v) => v.ok) && report.signature_key_obtained && report.cron_secret_generated && report.local_env_written;
} catch (e) {
  report.error = redact(e instanceof Error ? e.message : String(e));
}

const safe = JSON.parse(redact(JSON.stringify(report)));
console.log(JSON.stringify(safe, null, 2));
process.exit(report.pass ? 0 : 1);
