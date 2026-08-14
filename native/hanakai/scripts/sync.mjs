#!/usr/bin/env node
/**
 * Sync Capacitor native projects with plugins and web assets,
 * then re-apply tracked iOS release settings (iPhone-only, version/build).
 *
 * Usage:
 *   node scripts/sync.mjs          # sync all platforms
 *   node scripts/sync.mjs ios      # sync iOS only
 *   node scripts/sync.mjs android  # sync Android only
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const platform = process.argv[2];

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const iosDir = join(root, 'ios');
const androidDir = join(root, 'android');

if (!existsSync(iosDir) && !existsSync(androidDir)) {
  console.warn(
    '[hanakai] No native projects found. Run first:\n' +
      '  npm run cap:add:ios\n' +
      '  npm run cap:add:android',
  );
}

const capArgs = ['cap', 'sync'];
if (platform === 'ios' || platform === 'android') {
  capArgs.push(platform);
} else if (platform) {
  console.error(`Unknown platform: ${platform}. Use ios, android, or omit for all.`);
  process.exit(1);
}

run('npx', capArgs);

const applyIos = join(__dirname, 'apply-ios-config.mjs');
if (existsSync(applyIos) && (!platform || platform === 'ios')) {
  run('node', [applyIos]);
} else {
  const applyPlist = join(__dirname, 'apply-ios-plist.mjs');
  if (existsSync(applyPlist) && (!platform || platform === 'ios')) {
    run('node', [applyPlist]);
  }
}

console.log('[hanakai] Sync complete.');
