#!/usr/bin/env node
/**
 * Read-only Production audit of hanakai_members.avatar_url.
 * Does not update or delete any rows.
 */
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[t.slice(0, i).trim()] = v;
  }
  return out;
}

const env = {
  ...loadEnv(resolve(ROOT, '.env.local')),
  ...loadEnv(resolve(ROOT, '.env.secrets.local')),
  ...process.env,
};

const GENDER_FALLBACK = new Set([
  '/images/avatars/ken.webp',
  '/images/avatars/aoi.webp',
  '/images/profile-sample.webp',
  '/images/profile-sample-male.webp',
]);
const STOCK = /randomuser\.me|pravatar\.cc|i\.pravatar|picsum\.photos|images\.unsplash\.com/i;
const SEED_LOCAL = /^\/images\/avatars\//;
const UPLOAD = /\/storage\/v1\/object\/public\/profile-photos\//i;

function classify(url) {
  const t = (url ?? '').trim();
  if (!t) return 'empty';
  if (UPLOAD.test(t)) return 'user-upload';
  if (GENDER_FALLBACK.has(t)) return 'gender-fallback-sample';
  if (STOCK.test(t)) return 'stock-face';
  if (SEED_LOCAL.test(t)) return 'seed-or-local-avatar';
  return 'other';
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await admin
  .from('hanakai_members')
  .select('id, nickname, gender, avatar_url, created_at')
  .order('created_at', { ascending: false });

if (error) {
  console.error(error);
  process.exit(1);
}

const rows = data ?? [];
const buckets = {};
for (const row of rows) {
  const kind = classify(row.avatar_url);
  buckets[kind] ??= [];
  buckets[kind].push(row);
}

const summary = Object.fromEntries(
  Object.entries(buckets).map(([k, list]) => [k, list.length]),
);

console.log(JSON.stringify({
  total: rows.length,
  summary,
  ken: rows.filter((r) => r.nickname === 'ケン').map((r) => ({
    id: r.id,
    nickname: r.nickname,
    gender: r.gender,
    avatar_url: r.avatar_url,
    kind: classify(r.avatar_url),
    created_at: r.created_at,
  })),
  genderFallbackSamples: (buckets['gender-fallback-sample'] ?? []).map((r) => ({
    id: r.id,
    nickname: r.nickname,
    avatar_url: r.avatar_url,
  })),
  stockFaces: (buckets['stock-face'] ?? []).slice(0, 20).map((r) => ({
    id: r.id,
    nickname: r.nickname,
    avatar_url: r.avatar_url,
  })),
  other: (buckets.other ?? []).slice(0, 20).map((r) => ({
    id: r.id,
    nickname: r.nickname,
    avatar_url: r.avatar_url,
  })),
}, null, 2));
