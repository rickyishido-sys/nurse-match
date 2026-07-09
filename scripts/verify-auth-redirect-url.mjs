#!/usr/bin/env node
/**
 * Verify HANAKAI auth redirect URL resolution.
 * Usage: node scripts/verify-auth-redirect-url.mjs
 */
import assert from 'node:assert/strict';

const HANAKAI = 'https://hanakai.kranz.design';
const NURSE = 'https://nurse.kranz.design';

function normalizeOrigin(origin) {
  const trimmed = origin.trim().replace(/\/+$/, '');
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

function isLocalOrigin(origin) {
  try {
    const host = new URL(origin).hostname;
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return false;
  }
}

function resolveHanakaiSiteOrigin(siteUrl, requestOrigin, { vercelEnv, nodeEnv }) {
  let origin = normalizeOrigin(siteUrl);
  if (origin.includes('nurse.kranz.design')) origin = HANAKAI;
  if (vercelEnv === 'production') return HANAKAI;
  if (nodeEnv === 'development' && requestOrigin && isLocalOrigin(requestOrigin)) {
    return normalizeOrigin(requestOrigin);
  }
  return origin;
}

function hanakaiEmailRedirectUrl(siteUrl, requestOrigin, env) {
  return `${resolveHanakaiSiteOrigin(siteUrl, requestOrigin, env)}/auth/callback`;
}

// Production: always hanakai regardless of request origin
assert.equal(
  hanakaiEmailRedirectUrl(HANAKAI, NURSE, { vercelEnv: 'production', nodeEnv: 'production' }),
  `${HANAKAI}/auth/callback`,
);

// Production: legacy nurse env var must not leak into redirect
assert.equal(
  hanakaiEmailRedirectUrl(NURSE, NURSE, { vercelEnv: 'production', nodeEnv: 'production' }),
  `${HANAKAI}/auth/callback`,
);

// Empty env falls back to config default (hanakai) in production
assert.equal(
  hanakaiEmailRedirectUrl(HANAKAI, null, { vercelEnv: 'production', nodeEnv: 'production' }),
  `${HANAKAI}/auth/callback`,
);

// Local dev: localhost request origin is allowed
assert.equal(
  hanakaiEmailRedirectUrl(HANAKAI, 'http://localhost:3000', { vercelEnv: 'development', nodeEnv: 'development' }),
  'http://localhost:3000/auth/callback',
);

console.log(JSON.stringify({ ok: true, canonical: `${HANAKAI}/auth/callback` }, null, 2));
