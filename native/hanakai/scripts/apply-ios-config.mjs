#!/usr/bin/env node
/**
 * Apply tracked iOS release settings into the gitignored ios/ project.
 *
 * Why: `npx cap add ios` / Capacitor templates set TARGETED_DEVICE_FAMILY="1,2"
 * and ship a placeholder AppIcon. HANAKAI App Store policy is iPhone-only
 * (family 1) with the official flower AppIcon from ios-config/.
 *
 * Usage:
 *   node scripts/apply-ios-config.mjs
 *   (also invoked from scripts/sync.mjs after `cap sync`)
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const releasePath = join(root, 'ios-config/release.json');
const plistPath = join(root, 'ios/App/App/Info.plist');
const additionsPath = join(root, 'ios-config/Info.plist.additions.xml');
const pbxprojPath = join(root, 'ios/App/App.xcodeproj/project.pbxproj');
const trackedAppIconDir = join(root, 'ios-config/AppIcon.appiconset');
const iosAppIconDir = join(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');

function loadRelease() {
  if (!existsSync(releasePath)) {
    console.error('[hanakai] missing', releasePath);
    process.exit(1);
  }
  return JSON.parse(readFileSync(releasePath, 'utf8'));
}

function applyPbxproj(release) {
  if (!existsSync(pbxprojPath)) {
    console.warn('[hanakai] project.pbxproj not found — run npm run cap:add:ios first:', pbxprojPath);
    return false;
  }

  let pbx = readFileSync(pbxprojPath, 'utf8');
  const before = pbx;

  pbx = pbx.replace(
    /TARGETED_DEVICE_FAMILY = [^;]+;/g,
    `TARGETED_DEVICE_FAMILY = ${release.targetedDeviceFamily};`,
  );
  pbx = pbx.replace(
    /MARKETING_VERSION = [^;]+;/g,
    `MARKETING_VERSION = ${release.marketingVersion};`,
  );
  pbx = pbx.replace(
    /CURRENT_PROJECT_VERSION = [^;]+;/g,
    `CURRENT_PROJECT_VERSION = ${release.currentProjectVersion};`,
  );
  pbx = pbx.replace(
    /PRODUCT_BUNDLE_IDENTIFIER = [^;]+;/g,
    `PRODUCT_BUNDLE_IDENTIFIER = ${release.bundleId};`,
  );

  if (pbx === before) {
    console.log('[hanakai] project.pbxproj already matches ios-config/release.json');
  } else {
    writeFileSync(pbxprojPath, pbx);
    console.log(
      `[hanakai] project.pbxproj updated: VERSION=${release.marketingVersion} BUILD=${release.currentProjectVersion} TARGETED_DEVICE_FAMILY=${release.targetedDeviceFamily} BUNDLE=${release.bundleId}`,
    );
  }

  const verify = readFileSync(pbxprojPath, 'utf8');
  const familyMatches = [...verify.matchAll(/TARGETED_DEVICE_FAMILY = ([^;]+);/g)].map((m) => m[1]);
  const badFamily = familyMatches.filter((v) => v !== String(release.targetedDeviceFamily));
  if (badFamily.length || familyMatches.length === 0) {
    console.error('[hanakai] TARGETED_DEVICE_FAMILY verification failed:', familyMatches);
    process.exit(1);
  }
  if (verify.includes('TARGETED_DEVICE_FAMILY = "1,2";') || verify.includes('TARGETED_DEVICE_FAMILY = 1,2;')) {
    console.error('[hanakai] Universal device family still present — abort');
    process.exit(1);
  }
  return true;
}

function extractBlock(xml, key) {
  const re = new RegExp(`<key>${key}<\\/key>[\\s\\S]*?(?=(<key>|</dict>))`, 'm');
  const m = xml.match(re);
  return m ? m[0].trim() : null;
}

function applyPlistAdditions() {
  if (!existsSync(plistPath)) {
    console.warn('[hanakai] Info.plist not found — run cap add ios first:', plistPath);
    return false;
  }
  if (!existsSync(additionsPath)) {
    console.warn('[hanakai] additions file missing:', additionsPath);
    return false;
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
  return true;
}

/** Replace Capacitor placeholder AppIcon with tracked HANAKAI flower assets. */
function applyAppIcon() {
  if (!existsSync(trackedAppIconDir)) {
    console.error('[hanakai] missing tracked AppIcon set:', trackedAppIconDir);
    process.exit(1);
  }
  const contentsPath = join(trackedAppIconDir, 'Contents.json');
  const marketingIcon = join(trackedAppIconDir, 'AppIcon-1024.png');
  if (!existsSync(contentsPath) || !existsSync(marketingIcon)) {
    console.error('[hanakai] AppIcon.appiconset incomplete (need Contents.json + AppIcon-1024.png)');
    process.exit(1);
  }

  const assetsRoot = join(root, 'ios/App/App/Assets.xcassets');
  if (!existsSync(assetsRoot)) {
    console.warn('[hanakai] Assets.xcassets not found — run npm run cap:add:ios first:', assetsRoot);
    return false;
  }

  mkdirSync(dirname(iosAppIconDir), { recursive: true });
  rmSync(iosAppIconDir, { recursive: true, force: true });
  cpSync(trackedAppIconDir, iosAppIconDir, { recursive: true });

  const copied = readdirSync(iosAppIconDir);
  if (!copied.includes('AppIcon-1024.png') || !copied.includes('Contents.json')) {
    console.error('[hanakai] AppIcon copy verification failed:', copied);
    process.exit(1);
  }
  console.log(`[hanakai] AppIcon.appiconset replaced with HANAKAI flower icons (${copied.length} files)`);
  return true;
}

const release = loadRelease();
if (String(release.targetedDeviceFamily) !== '1') {
  console.error('[hanakai] ios-config/release.json must keep targetedDeviceFamily=1 (iPhone only)');
  process.exit(1);
}

applyPbxproj(release);
applyPlistAdditions();
applyAppIcon();
console.log('[hanakai] apply-ios-config complete.');
