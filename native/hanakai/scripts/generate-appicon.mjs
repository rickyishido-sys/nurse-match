#!/usr/bin/env node
/**
 * Regenerate tracked iOS AppIcon.appiconset from public/brand/hanakai-logo.png.
 * Run after logo updates, then commit ios-config/AppIcon.appiconset/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.join(root, '../..');
const logoPath = path.join(repoRoot, 'public/brand/hanakai-logo.png');
const outDir = path.join(root, 'ios-config/AppIcon.appiconset');

if (!fs.existsSync(logoPath)) {
  console.error('Missing', logoPath);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const store1024 = path.join(outDir, 'AppIcon-1024.png');
await sharp(logoPath)
  .resize(1024, 1024, { fit: 'cover' })
  .flatten({ background: { r: 255, g: 255, b: 255 } })
  .removeAlpha()
  .png()
  .toFile(store1024);

const sizes = [
  { name: 'wendy-40.png', size: 40 },
  { name: 'wendy-60.png', size: 60 },
  { name: 'settings-58.png', size: 58 },
  { name: 'settings-87.png', size: 87 },
  { name: 'spotlight-80.png', size: 80 },
  { name: 'spotlight-120.png', size: 120 },
  { name: 'app-120.png', size: 120 },
  { name: 'app-180.png', size: 180 },
];

for (const { name, size } of sizes) {
  await sharp(store1024).resize(size, size).png().toFile(path.join(outDir, name));
}

const contents = {
  images: [
    { idiom: 'iphone', scale: '2x', size: '20x20', filename: 'wendy-40.png' },
    { idiom: 'iphone', scale: '3x', size: '20x20', filename: 'wendy-60.png' },
    { idiom: 'iphone', scale: '2x', size: '29x29', filename: 'settings-58.png' },
    { idiom: 'iphone', scale: '3x', size: '29x29', filename: 'settings-87.png' },
    { idiom: 'iphone', scale: '2x', size: '40x40', filename: 'spotlight-80.png' },
    { idiom: 'iphone', scale: '3x', size: '40x40', filename: 'spotlight-120.png' },
    { idiom: 'iphone', scale: '2x', size: '60x60', filename: 'app-120.png' },
    { idiom: 'iphone', scale: '3x', size: '60x60', filename: 'app-180.png' },
    { idiom: 'ios-marketing', scale: '1x', size: '1024x1024', filename: 'AppIcon-1024.png' },
  ],
  info: { author: 'hanakai', version: 1 },
};
fs.writeFileSync(path.join(outDir, 'Contents.json'), `${JSON.stringify(contents, null, 2)}\n`);
console.log('Regenerated', outDir);
