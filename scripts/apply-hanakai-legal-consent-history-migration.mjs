#!/usr/bin/env node
/**
 * Apply HANAKAI legal consent history migration via Supabase CLI (linked project).
 * Usage: node scripts/apply-hanakai-legal-consent-history-migration.mjs
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const sqlPath = 'supabase/migrations/20260725_hanakai_legal_consent_history.sql';

try {
  execSync(`npx supabase db query --linked -f ${sqlPath}`, {
    cwd: root,
    stdio: 'inherit',
  });
  console.log('Applied:', sqlPath);
} catch (e) {
  console.error('Migration apply failed:', e.message);
  process.exit(1);
}
