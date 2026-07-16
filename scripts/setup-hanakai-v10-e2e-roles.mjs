#!/usr/bin/env node
/**
 * HANAKAI Ver1.0 Safety E2E — 5 identity roles (A–E)
 * Writes credentials to .env.secrets.local (gitignored).
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
  { key: 'unsubmitted', nickname: 'E2E未提出', identity: { identity_verified: false, document_upload_status: 'none', trust_verification_status: 'pending', safety_flags: [] } },
  { key: 'pending', nickname: 'E2E確認中', identity: { identity_verified: false, document_upload_status: 'pending', trust_verification_status: 'reviewing', safety_flags: [] } },
  { key: 'verified', nickname: 'E2E確認済み', identity: { identity_verified: true, document_upload_status: 'approved', trust_verification_status: 'verified', safety_flags: ['本人確認書類確認済'] } },
  { key: 'resubmission', nickname: 'E2E再提出', identity: { identity_verified: false, document_upload_status: 'rejected', trust_verification_status: 'rejected', safety_flags: ['再提出依頼'] } },
  { key: 'admin', nickname: 'E2E運営', identity: { identity_verified: true, document_upload_status: 'approved', trust_verification_status: 'verified', safety_flags: [] } },
];

const created = {};

for (const acc of accounts) {
  const email = `hanakai-e2e-${acc.key}+${stamp}@test.hanakai.local`;
  const { data: userData, error: userErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nickname: acc.nickname },
  });
  if (userErr || !userData.user) {
    console.error(`Failed to create ${acc.key}`, userErr?.message);
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
      ...acc.identity,
    })
    .select('id')
    .single();

  if (memErr || !member) {
    console.error(`Failed member ${acc.key}`, memErr?.message);
    process.exit(3);
  }

  created[acc.key] = { email, memberId: member.id, authUserId: userData.user.id };
}

let secrets = existsSync(secretsPath) ? readFileSync(secretsPath, 'utf8') : '';
const lines = [
  '',
  `# HANAKAI Ver1.0 Safety E2E (${new Date().toISOString()})`,
  `HANAKAI_V10_E2E_PASSWORD=${password}`,
  `HANAKAI_V10_E2E_UNSUBMITTED_EMAIL=${created.unsubmitted.email}`,
  `HANAKAI_V10_E2E_UNSUBMITTED_MEMBER_ID=${created.unsubmitted.memberId}`,
  `HANAKAI_V10_E2E_PENDING_EMAIL=${created.pending.email}`,
  `HANAKAI_V10_E2E_PENDING_MEMBER_ID=${created.pending.memberId}`,
  `HANAKAI_V10_E2E_VERIFIED_EMAIL=${created.verified.email}`,
  `HANAKAI_V10_E2E_VERIFIED_MEMBER_ID=${created.verified.memberId}`,
  `HANAKAI_V10_E2E_RESUBMISSION_EMAIL=${created.resubmission.email}`,
  `HANAKAI_V10_E2E_RESUBMISSION_MEMBER_ID=${created.resubmission.memberId}`,
  `HANAKAI_V10_E2E_ADMIN_EMAIL=${created.admin.email}`,
  `HANAKAI_V10_E2E_ADMIN_MEMBER_ID=${created.admin.memberId}`,
  `# Vercel Preview: add ${created.admin.memberId} to HANAKAI_CONNECTION_ADMIN_MEMBER_IDS`,
];
secrets += lines.join('\n') + '\n';
writeFileSync(secretsPath, secrets);

// Local/preview runtime: ensure admin member ID is registered
const envLocalPath = path.join(root, '.env.local');
let envLocal = existsSync(envLocalPath) ? readFileSync(envLocalPath, 'utf8') : '';
const adminIds = new Set(
  (envLocal.match(/HANAKAI_CONNECTION_ADMIN_MEMBER_IDS=(.*)/)?.[1] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);
adminIds.add(created.admin.memberId);
const adminLine = `HANAKAI_CONNECTION_ADMIN_MEMBER_IDS=${[...adminIds].join(',')}`;
if (/HANAKAI_CONNECTION_ADMIN_MEMBER_IDS=/.test(envLocal)) {
  envLocal = envLocal.replace(/HANAKAI_CONNECTION_ADMIN_MEMBER_IDS=.*/m, adminLine);
} else {
  envLocal += `\n${adminLine}\n`;
}
writeFileSync(envLocalPath, envLocal);

console.log(JSON.stringify({ ok: true, password, accounts: created }, null, 2));
