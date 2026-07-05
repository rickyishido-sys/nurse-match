/**
 * HANAKAI Connection — favicon / PWA icon generator.
 * Run: node scripts/generate-hanakai-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const svgPath = path.join(root, 'public/icons/hanakai-icon.svg');
const svg = fs.readFileSync(svgPath);

async function writePng(relPath, size) {
  const out = path.join(root, relPath);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log(`wrote ${relPath} (${size}x${size})`);
}

async function main() {
  await writePng('public/icon.png', 512);
  await writePng('public/apple-touch-icon.png', 180);
  await writePng('src/app/icon.png', 512);
  await writePng('src/app/apple-icon.png', 180);

  const icoSizes = [16, 32, 48];
  const pngBuffers = await Promise.all(
    icoSizes.map((size) => sharp(svg).resize(size, size).png().toBuffer()),
  );

  let toIco;
  try {
    toIco = (await import('to-ico')).default;
  } catch {
    console.error('to-ico is required. Run: npm install --no-save to-ico');
    process.exit(1);
  }

  const ico = await toIco(pngBuffers);
  fs.writeFileSync(path.join(root, 'public/favicon.ico'), ico);
  fs.writeFileSync(path.join(root, 'src/app/favicon.ico'), ico);
  console.log('wrote public/favicon.ico');
  console.log('wrote src/app/favicon.ico');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
