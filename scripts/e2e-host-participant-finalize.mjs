#!/usr/bin/env node
/**
 * Runner for host participant finalize mock tests.
 * Usage: node scripts/e2e-host-participant-finalize.mjs
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const stubSrc = path.join(__dirname, 'stubs/server-only-package');
const stubDest = path.join(root, 'node_modules/server-only');

if (!existsSync(stubDest)) {
  mkdirSync(stubDest, { recursive: true });
  cpSync(stubSrc, stubDest, { recursive: true });
}

execSync('npx --yes tsx scripts/e2e-host-participant-finalize.ts', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, HANAKAI_CONNECTION_BACKEND: 'mock' },
});
