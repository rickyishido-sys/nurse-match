#!/usr/bin/env node
/**
 * Apply HANAKAI event operations migration via Supabase CLI (linked project).
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sqlPath = path.join(root, 'supabase/migrations/20260716_hanakai_event_operations.sql');

if (!existsSync(sqlPath)) {
  console.error('Migration file missing');
  process.exit(1);
}

try {
  execSync('npx supabase db push --linked --include-all', {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  console.log(JSON.stringify({ ok: true, action: 'db_push' }));
} catch (e) {
  console.log(
    JSON.stringify({
      ok: false,
      action: 'manual_required',
      message: 'Run supabase/migrations/20260716_hanakai_event_operations.sql in SQL Editor',
      sqlPath,
    }),
  );
  process.exit(1);
}
