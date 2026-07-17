#!/usr/bin/env node
/**
 * Apply HANAKAI legal consent + RLS migration via Supabase CLI (linked project).
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sqlPath = path.join(root, 'supabase/migrations/20260718_hanakai_legal_consent_rls.sql');

if (!existsSync(sqlPath)) {
  console.error('Migration file missing:', sqlPath);
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const logDir = path.join(root, 'scripts/e2e-screenshots/migration-logs');
try {
  execSync(`mkdir -p ${JSON.stringify(logDir)}`, { cwd: root });
} catch {
  // noop
}

try {
  const out = execSync('npx supabase db query --linked -f supabase/migrations/20260718_hanakai_legal_consent_rls.sql', {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  });
  const result = { ok: true, action: 'db_push', stamp, sqlPath, output: out.slice(-2000) };
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  const stderr = e.stderr?.toString?.() ?? '';
  const stdout = e.stdout?.toString?.() ?? '';
  console.log(
    JSON.stringify(
      {
        ok: false,
        action: 'failed',
        stamp,
        sqlPath,
        message: String(e.message ?? e),
        stdout: stdout.slice(-2000),
        stderr: stderr.slice(-2000),
      },
      null,
      2,
    ),
  );
  process.exit(1);
}
