#!/usr/bin/env node
/**
 * Verify HANAKAI auth redirect URL resolution (mirrors src/lib/connection/auth-redirect.ts).
 * Usage: node scripts/verify-auth-redirect-url.mjs
 */
import assert from 'node:assert/strict';

const HANAKAI = 'https://hanakai.kranz.design';
const NURSE = 'https://nurse.kranz.design';
const PREVIEW = 'https://nurse-match-beta-l9aufvnjv-info-10353781s-projects.vercel.app';

function normalizeOrigin(origin) {
  const trimmed = origin.trim().replace(/\/+$/, '');
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

// Keep in sync with resolveHanakaiSiteOrigin().
function resolveHanakaiSiteOrigin(siteUrl, requestOrigin, { vercelEnv, vercelUrl } = {}) {
  if (vercelEnv === 'production') return HANAKAI;
  if (requestOrigin) return normalizeOrigin(requestOrigin);
  if (vercelEnv === 'preview' && vercelUrl) return normalizeOrigin(vercelUrl);
  const origin = normalizeOrigin(siteUrl);
  return origin.includes('nurse.kranz.design') ? HANAKAI : origin;
}

function hanakaiEmailRedirectUrl(siteUrl, requestOrigin, env) {
  return `${resolveHanakaiSiteOrigin(siteUrl, requestOrigin, env)}/auth/callback`;
}

// Production: always hanakai regardless of the request origin (Host-injection safe).
assert.equal(
  hanakaiEmailRedirectUrl(HANAKAI, PREVIEW, { vercelEnv: 'production' }),
  `${HANAKAI}/auth/callback`,
);

// Production: legacy nurse env var must not leak into redirect.
assert.equal(
  hanakaiEmailRedirectUrl(NURSE, NURSE, { vercelEnv: 'production' }),
  `${HANAKAI}/auth/callback`,
);

// Preview: returns the CURRENT preview URL (not localhost, not production).
assert.equal(
  hanakaiEmailRedirectUrl(HANAKAI, PREVIEW, { vercelEnv: 'preview' }),
  `${PREVIEW}/auth/callback`,
);

// Preview without a Host header: falls back to VERCEL_URL of the deployment.
assert.equal(
  hanakaiEmailRedirectUrl(HANAKAI, null, {
    vercelEnv: 'preview',
    vercelUrl: 'nurse-match-beta-l9aufvnjv-info-10353781s-projects.vercel.app',
  }),
  `${PREVIEW}/auth/callback`,
);

// Local dev: localhost request origin is honored.
assert.equal(
  hanakaiEmailRedirectUrl(HANAKAI, 'http://localhost:3000', { vercelEnv: 'development' }),
  'http://localhost:3000/auth/callback',
);

// No request origin, no Vercel env: falls back to configured SITE_URL.
assert.equal(
  hanakaiEmailRedirectUrl(HANAKAI, null, {}),
  `${HANAKAI}/auth/callback`,
);

console.log(JSON.stringify({ ok: true, canonical: `${HANAKAI}/auth/callback`, preview: `${PREVIEW}/auth/callback` }, null, 2));
