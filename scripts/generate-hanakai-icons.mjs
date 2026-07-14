/**
 * HANAKAI — favicon / PWA / OGP asset generator from brand logo PNG.
 * Run: node scripts/generate-hanakai-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const logoPath = path.join(root, 'public/brand/hanakai-logo.png');

if (!fs.existsSync(logoPath)) {
  console.error('Missing public/brand/hanakai-logo.png — copy from public/HANAKAI ROGO.png first.');
  process.exit(1);
}

const logo = sharp(logoPath);

async function writePng(relPath, size, padding = 0.08) {
  const out = path.join(root, relPath);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const canvas = Math.round(size * (1 + padding * 2));
  const inset = Math.round(size * padding);
  const resized = await logo.clone().resize(size, size, { fit: 'cover' }).png().toBuffer();
  await sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: resized, left: inset, top: inset }])
    .resize(size, size)
    .png()
    .toFile(out);
  console.log(`wrote ${relPath} (${size}x${size})`);
}

async function writeOgImage() {
  const out = path.join(root, 'public/og-image.png');
  const width = 1200;
  const height = 630;
  const logoSize = 220;
  const logoBuf = await logo.clone().resize(logoSize, logoSize, { fit: 'cover' }).png().toBuffer();

  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#faf7f2"/>
      <stop offset="55%" style="stop-color:#f3f7f5"/>
      <stop offset="100%" style="stop-color:#fff8f5"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="1040" cy="120" r="180" fill="#e85d4c" opacity="0.08"/>
  <circle cx="140" cy="520" r="220" fill="#1f5d4f" opacity="0.07"/>
  <text x="420" y="250" font-family="Hiragino Sans, Noto Sans JP, sans-serif" font-size="72" font-weight="700" fill="#1a1a1a">華会</text>
  <text x="420" y="320" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="600" letter-spacing="12" fill="#b8956a">HANAKAI</text>
  <text x="420" y="410" font-family="Hiragino Sans, Noto Sans JP, sans-serif" font-size="40" font-weight="500" fill="#4a4a4a">体験から始まる、新しい出会い。</text>
</svg>`;

  const textLayer = await sharp(Buffer.from(svg)).png().toBuffer();
  await sharp({
    create: { width, height, channels: 4, background: { r: 250, g: 247, b: 242, alpha: 1 } },
  })
    .composite([
      { input: textLayer, left: 0, top: 0 },
      { input: logoBuf, left: 120, top: 205 },
    ])
    .png()
    .toFile(out);
  console.log('wrote public/og-image.png (1200x630)');
}

async function main() {
  await writePng('public/icon.png', 512);
  await writePng('public/apple-touch-icon.png', 180);
  await writePng('src/app/icon.png', 512);
  await writePng('src/app/apple-icon.png', 180);
  await writeOgImage();

  const icoSizes = [16, 32, 48];
  const pngBuffers = await Promise.all(
    icoSizes.map((size) => logo.clone().resize(size, size, { fit: 'cover' }).png().toBuffer()),
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
