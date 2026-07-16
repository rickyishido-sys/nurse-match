#!/usr/bin/env node
/**
 * Setup Preview E2E accounts (host / participant / admin).
 * Writes credentials to .env.secrets.local (gitignored). Never commit secrets.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const secretsPath = path.join(root, '.env.secrets.local');

function loadEnv(filePath) {
  if (!existsSync(filePath)) return {};
  const env = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[t.slice(0, i).trim()] = v;
  }
  return env;
}

const env = { ...loadEnv(path.join(root, '.env.production.local')), ...loadEnv(secretsPath) };
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRole) {
  console.error('Missing Supabase URL or service role key');
  process.exit(1);
}

const admin = createClient(url, serviceRole, { auth: { persistSession: false } });
const stamp = Date.now().toString().slice(-6);
const password = `E2eHanakai!${stamp}`;

const accounts = [
  { role: 'host', email: `hanakai-e2e-host+${stamp}@test.hanakai.local`, nickname: 'E2E主催者' },
  { role: 'participant', email: `hanakai-e2e-participant+${stamp}@test.hanakai.local`, nickname: 'E2E参加者' },
  { role: 'admin', email: `hanakai-e2e-admin+${stamp}@test.hanakai.local`, nickname: 'E2E運営' },
];

const created = {};

for (const acc of accounts) {
  const { data: userData, error: userErr } = await admin.auth.admin.createUser({
    email: acc.email,
    password,
    email_confirm: true,
    user_metadata: { nickname: acc.nickname },
  });
  if (userErr || !userData.user) {
    console.error(`Failed to create ${acc.role}`, userErr?.message);
    process.exit(2);
  }

  const { data: member, error: memErr } = await admin
    .from('hanakai_members')
    .insert({
      auth_user_id: userData.user.id,
      nickname: acc.nickname,
      gender: 'female',
      area: '東京',
      age: 30,
      age_band: '30代',
      avatar_url: 'https://regjgwrugiwbmxcsxuex.supabase.co/storage/v1/object/public/avatars/default.png',
    })
    .select('id')
    .single();

  if (memErr || !member) {
    console.error(`Failed member ${acc.role}`, memErr?.message);
    process.exit(3);
  }

  created[acc.role] = { email: acc.email, memberId: member.id, authUserId: userData.user.id };
}

let secrets = existsSync(secretsPath) ? readFileSync(secretsPath, 'utf8') : '';
const lines = [
  '',
  `# HANAKAI Event Operations E2E (${new Date().toISOString()})`,
  `HANAKAI_E2E_HOST_EMAIL=${created.host.email}`,
  `HANAKAI_E2E_HOST_PASSWORD=${password}`,
  `HANAKAI_E2E_HOST_MEMBER_ID=${created.host.memberId}`,
  `HANAKAI_E2E_PARTICIPANT_EMAIL=${created.participant.email}`,
  `HANAKAI_E2E_PARTICIPANT_PASSWORD=${password}`,
  `HANAKAI_E2E_PARTICIPANT_MEMBER_ID=${created.participant.memberId}`,
  `HANAKAI_E2E_ADMIN_EMAIL=${created.admin.email}`,
  `HANAKAI_E2E_ADMIN_PASSWORD=${password}`,
  `HANAKAI_E2E_ADMIN_MEMBER_ID=${created.admin.memberId}`,
  `# Add to Vercel Preview: HANAKAI_CONNECTION_ADMIN_MEMBER_IDS includes ${created.admin.memberId}`,
];
secrets += lines.join('\n') + '\n';
writeFileSync(secretsPath, secrets);

console.log(JSON.stringify({ ok: true, password, accounts: created }, null, 2));
