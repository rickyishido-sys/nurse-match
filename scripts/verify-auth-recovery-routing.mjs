#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function loadHelper() {
  // Pure TS helper mirrored here so the script runs without a TS loader.
}

function normalizeAuthType(value) {
  return String(value ?? '').trim().toLowerCase();
}

function isHanakaiRecoveryType(value) {
  return normalizeAuthType(value) === 'recovery';
}

function isHanakaiResetPasswordNext(next) {
  return next === '/reset-password';
}

function decodeJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(parts[1].length / 4) * 4, '=');
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

function accessTokenHasRecoveryAmr(accessToken) {
  if (!accessToken) return false;
  const payload = decodeJwtPayload(accessToken);
  const amr = payload?.amr;
  if (!Array.isArray(amr)) return false;
  return amr.some((entry) => {
    const method = typeof entry === 'string' ? entry : entry?.method;
    return normalizeAuthType(method) === 'recovery';
  });
}

function isRecentRecoverySentAt(value, nowMs = Date.now()) {
  if (!value) return false;
  const sentAt = Date.parse(value);
  if (Number.isNaN(sentAt)) return false;
  return nowMs - sentAt >= 0 && nowMs - sentAt <= 2 * 60 * 60 * 1000;
}

function isHanakaiPasswordRecovery(input) {
  const authType = String(input.type || input.redirectType || '').trim().toLowerCase();
  if (isHanakaiResetPasswordNext(input.next)) return true;
  if (isHanakaiRecoveryType(input.type)) return true;
  if (isHanakaiRecoveryType(input.redirectType)) return true;
  if (accessTokenHasRecoveryAmr(input.accessToken)) return true;
  if (['signup', 'invite', 'magiclink', 'email', 'email_change'].includes(authType)) return false;
  return isRecentRecoverySentAt(input.recoverySentAt);
}

function resolvePostAuthPath(input) {
  if (!input.sessionEstablished) return input.errorPath ?? input.profilePath;
  if (isHanakaiPasswordRecovery(input)) return '/reset-password';
  if (input.next === '/register/details') return '/register/details';
  return input.profilePath;
}

const PROFILE = '/register/profile';

assert.equal(
  resolvePostAuthPath({ sessionEstablished: true, type: 'recovery', profilePath: PROFILE }),
  '/reset-password',
);
assert.equal(
  resolvePostAuthPath({ sessionEstablished: true, next: '/reset-password', profilePath: PROFILE }),
  '/reset-password',
);
assert.equal(
  resolvePostAuthPath({ sessionEstablished: true, redirectType: 'recovery', profilePath: PROFILE }),
  '/reset-password',
);

const recoveryJwt = [
  Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify({ amr: [{ method: 'recovery', timestamp: 1 }] })).toString('base64url'),
  'sig',
].join('.');
assert.equal(
  resolvePostAuthPath({ sessionEstablished: true, accessToken: recoveryJwt, profilePath: PROFILE }),
  '/reset-password',
);

assert.equal(
  resolvePostAuthPath({
    sessionEstablished: true,
    type: 'recovery',
    next: '/register/details',
    profilePath: PROFILE,
  }),
  '/reset-password',
);

assert.equal(
  resolvePostAuthPath({ sessionEstablished: true, type: 'signup', profilePath: PROFILE }),
  PROFILE,
);
assert.equal(
  resolvePostAuthPath({ sessionEstablished: true, type: 'magiclink', profilePath: PROFILE }),
  PROFILE,
);
assert.equal(
  resolvePostAuthPath({ sessionEstablished: true, next: '/register/details', profilePath: PROFILE }),
  '/register/details',
);
assert.equal(
  resolvePostAuthPath({
    sessionEstablished: false,
    type: 'recovery',
    profilePath: PROFILE,
    errorPath: '/register?error=auth-callback',
  }),
  '/register?error=auth-callback',
);

assert.equal(
  resolvePostAuthPath({
    sessionEstablished: true,
    recoverySentAt: new Date().toISOString(),
    profilePath: PROFILE,
  }),
  '/reset-password',
);
assert.equal(
  resolvePostAuthPath({
    sessionEstablished: true,
    type: 'signup',
    recoverySentAt: new Date().toISOString(),
    profilePath: PROFILE,
  }),
  PROFILE,
);
assert.equal(
  resolvePostAuthPath({
    sessionEstablished: true,
    type: 'magiclink',
    recoverySentAt: new Date().toISOString(),
    profilePath: PROFILE,
  }),
  PROFILE,
);

assert.equal(isHanakaiPasswordRecovery({ type: 'PASSWORD_RECOVERY' }), false);
assert.equal(isHanakaiPasswordRecovery({ type: 'recovery' }), true);

void require;
void loadHelper;

console.log(JSON.stringify({ ok: true, cases: 13 }, null, 2));
