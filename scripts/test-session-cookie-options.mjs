#!/usr/bin/env node
import assert from 'node:assert/strict';

const HANAKAI_AUTH_COOKIE_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

function mergeAuthCookieSetOptions(options) {
  const incoming = { ...(options ?? {}) };
  const rawMaxAge = incoming.maxAge;
  const isClear = rawMaxAge === 0 || rawMaxAge === '0';
  const maxAge = isClear
    ? 0
    : typeof rawMaxAge === 'number' && rawMaxAge > 0
      ? rawMaxAge
      : HANAKAI_AUTH_COOKIE_MAX_AGE_SECONDS;

  return {
    ...incoming,
    path: '/',
    sameSite: incoming.sameSite ?? 'lax',
    maxAge,
  };
}

const persisted = mergeAuthCookieSetOptions({ path: '/api/auth/callback', sameSite: 'lax' });
assert.equal(persisted.path, '/');
assert.equal(persisted.maxAge, HANAKAI_AUTH_COOKIE_MAX_AGE_SECONDS);

const cleared = mergeAuthCookieSetOptions({ maxAge: 0, path: '/' });
assert.equal(cleared.maxAge, 0);

const kept = mergeAuthCookieSetOptions({ maxAge: 3600 });
assert.equal(kept.maxAge, 3600);

console.log('PASS session-cookie-options');
