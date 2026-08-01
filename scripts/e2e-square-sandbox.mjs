#!/usr/bin/env node
/**
 * Square Sandbox E2E checklist (Preview / local).
 * Usage: node scripts/e2e-square-sandbox.mjs [baseUrl]
 */
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const outDir = path.join('scripts', 'e2e-screenshots', 'square-sandbox', new Date().toISOString().replace(/[:.]/g, '-'));

const checks = [
  { name: 'card_api_route_exists', path: '/api/hanakai/payments/card', method: 'GET', expectStatus: [405, 401] },
  { name: 'retry_api_route_exists', path: '/api/hanakai/payments/retry', method: 'GET', expectStatus: [405, 401] },
  { name: 'webhook_route_exists', path: '/api/webhooks/square', method: 'GET', expectStatus: [405, 401] },
  { name: 'payment_expiry_cron', path: '/api/hanakai/cron/payment-expiry', method: 'GET', expectStatus: [401, 405] },
  { name: 'events_create_page', path: '/events/create', method: 'GET', expectStatus: [200, 307, 308] },
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const results = [];

  for (const check of checks) {
    const res = await fetch(`${baseUrl}${check.path}`, { method: check.method, redirect: 'manual' });
    const pass = check.expectStatus.includes(res.status);
    results.push({ ...check, status: res.status, pass });
  }

  const report = {
    baseUrl,
    timestamp: new Date().toISOString(),
    passCount: results.filter((r) => r.pass).length,
    total: results.length,
    results,
    notes: [
      'Full card tokenize + charge requires Square Sandbox credentials and logged-in member.',
      'Apply migration 20260802_hanakai_square_payments.sql to Preview DB before integration tests.',
      'Do NOT deploy to Production or register Production webhooks.',
    ],
  };

  await writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (report.passCount !== report.total) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
