#!/usr/bin/env node
import assert from 'node:assert/strict';

const HANAKAI_ADMIN_PREFIX = '/admin/hanakai';
const HANAKAI_BLOCKED_EXACT = new Set(['/settings']);
const HANAKAI_BLOCKED_PREFIXES = ['/admin/connection', '/admin/male', '/admin/female', '/admin/reviews'];

function isBlockedPath(pathname) {
  if (HANAKAI_BLOCKED_EXACT.has(pathname)) return true;
  return HANAKAI_BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function resolveHanakaiRoute(pathname) {
  if (isBlockedPath(pathname)) return { kind: 'not_found' };
  if (pathname === '/admin' || pathname === HANAKAI_ADMIN_PREFIX || pathname.startsWith(`${HANAKAI_ADMIN_PREFIX}/`)) {
    return { kind: 'require_admin' };
  }
  if (pathname === '/admin/login') return { kind: 'allow_public' };
  if (pathname === '/reset-password') return { kind: 'allow_public' };
  return { kind: 'not_found' };
}

assert.equal(resolveHanakaiRoute('/admin').kind, 'require_admin');
assert.equal(resolveHanakaiRoute('/admin/hanakai').kind, 'require_admin');
assert.equal(resolveHanakaiRoute('/admin/hanakai/identity-reviews').kind, 'require_admin');
assert.equal(resolveHanakaiRoute('/admin/hanakai/reports').kind, 'require_admin');
assert.equal(resolveHanakaiRoute('/admin/login').kind, 'allow_public');
assert.equal(resolveHanakaiRoute('/admin/reviews').kind, 'not_found');
assert.equal(resolveHanakaiRoute('/admin/female').kind, 'not_found');
assert.equal(resolveHanakaiRoute('/reset-password').kind, 'allow_public');
assert.notEqual(resolveHanakaiRoute('/admin').kind, 'not_found');

console.log(JSON.stringify({ ok: true, adminTop: 'require_admin' }, null, 2));
