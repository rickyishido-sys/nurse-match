#!/usr/bin/env node
/**
 * Merge tracked Info.plist additions into ios/App/App/Info.plist after cap sync.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const plistPath = join(root, 'ios/App/App/Info.plist');
const additionsPath = join(root, 'ios-config/Info.plist.additions.xml');

if (!existsSync(plistPath)) {
  console.warn('[hanakai] Info.plist not found — run cap add ios first:', plistPath);
  process.exit(0);
}

if (!existsSync(additionsPath)) {
  console.warn('[hanakai] additions file missing:', additionsPath);
  process.exit(0);
}

const additions = readFileSync(additionsPath, 'utf8');
let plist = readFileSync(plistPath, 'utf8');

const keysToMerge = [
  'NSCameraUsageDescription',
  'NSPhotoLibraryUsageDescription',
  'NSPhotoLibraryAddUsageDescription',
  'ITSAppUsesNonExemptEncryption',
  'CFBundleURLTypes',
];

function extractBlock(xml, key) {
  const re = new RegExp(`<key>${key}<\\/key>[\\s\\S]*?(?=(<key>|</dict>))`, 'm');
  const m = xml.match(re);
  return m ? m[0].trim() : null;
}

let changed = false;
for (const key of keysToMerge) {
  if (plist.includes(`<key>${key}</key>`)) continue;
  const block = extractBlock(additions, key);
  if (!block) continue;
  plist = plist.replace(/\s*<\/dict>\s*<\/plist>/, `\n\t${block.replace(/\n/g, '\n\t')}\n</dict>\n</plist>`);
  changed = true;
}

if (changed) {
  writeFileSync(plistPath, plist);
  console.log('[hanakai] Info.plist merged from ios-config/Info.plist.additions.xml');
} else {
  console.log('[hanakai] Info.plist already contains required keys');
}
