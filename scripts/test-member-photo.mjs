#!/usr/bin/env node
/**
 * Pure helper checks for profile photo fallback (no gender person photos).
 */
import assert from 'node:assert/strict';

const GENDER_FALLBACK_SAMPLE_URLS = new Set([
  '/images/avatars/ken.webp',
  '/images/avatars/aoi.webp',
  '/images/profile-sample.webp',
  '/images/profile-sample-male.webp',
]);
const STOCK_FACE_HOST = /randomuser\.me|pravatar\.cc|i\.pravatar|picsum\.photos/i;

function isSystemPersonPlaceholderUrl(url) {
  const trimmed = url?.trim() ?? '';
  if (!trimmed) return true;
  if (GENDER_FALLBACK_SAMPLE_URLS.has(trimmed)) return true;
  if (STOCK_FACE_HOST.test(trimmed)) return true;
  if (/\/storage\/v1\/object\/public\/avatars\/default\.png/i.test(trimmed)) return true;
  return false;
}

function isLikelyUserUploadedPhotoUrl(url) {
  const trimmed = url?.trim() ?? '';
  if (!trimmed) return false;
  return /\/storage\/v1\/object\/public\/profile-photos\//i.test(trimmed);
}

assert.equal(isSystemPersonPlaceholderUrl(''), true);
assert.equal(isSystemPersonPlaceholderUrl('/images/avatars/ken.webp'), true);
assert.equal(isSystemPersonPlaceholderUrl('/images/avatars/aoi.webp'), true);
assert.equal(isSystemPersonPlaceholderUrl('/images/avatars/ayaka.webp'), false);
assert.equal(
  isSystemPersonPlaceholderUrl(
    'https://example.supabase.co/storage/v1/object/public/avatars/default.png',
  ),
  true,
);
assert.equal(
  isLikelyUserUploadedPhotoUrl(
    'https://xyz.supabase.co/storage/v1/object/public/profile-photos/m1/a.webp',
  ),
  true,
);
assert.equal(isLikelyUserUploadedPhotoUrl('/images/avatars/ken.webp'), false);
assert.equal(isLikelyUserUploadedPhotoUrl('/images/avatars/ayaka.webp'), false);

console.log('PASS member-photo placeholder classification');
