import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC = path.resolve(process.cwd(), 'public');
const ICONS = path.join(PUBLIC, 'icons');

const GREEN = '#1f5d4f';
const CREAM = '#f4efe6';
const RING = '#e3d9c8';

/** HANAKAI のシンボル — 細い線で描いた一輪のチューリップ（深緑）。 */
const flower = `
  <g fill="none" stroke="${GREEN}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
    <path d="M256 252 L256 374" />
    <path d="M256 324 C 206 316 188 284 190 254 C 222 266 248 294 256 324 Z" />
    <path d="M256 324 C 306 316 324 284 322 254 C 290 266 264 294 256 324 Z" />
    <path d="M256 252 C 226 224 226 188 256 162 C 286 188 286 224 256 252 Z" />
    <path d="M256 252 C 226 224 226 188 256 162 C 286 188 286 224 256 252 Z" transform="rotate(-27 256 252)" />
    <path d="M256 252 C 226 224 226 188 256 162 C 286 188 286 224 256 252 Z" transform="rotate(27 256 252)" />
  </g>`;

const circleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <circle cx="256" cy="256" r="256" fill="${CREAM}" />
  <circle cx="256" cy="256" r="250" fill="none" stroke="${RING}" stroke-width="6" />
  ${flower}
</svg>`;

const squareSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="104" fill="${CREAM}" />
  ${flower}
</svg>`;

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${CREAM}" />
  <g transform="translate(256 256) scale(0.78) translate(-256 -256)">${flower}</g>
</svg>`;

function pngFromSvg(svg, size) {
  return sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
}

/** 複数サイズの PNG を 1 つの ICO コンテナへ詰める（PNG 圧縮エントリ）。 */
function buildIco(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = [];
  const images = [];
  let offset = 6 + count * 16;
  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(entry);
    images.push(data);
  }
  return Buffer.concat([header, ...entries, ...images]);
}

async function main() {
  // icon.png — 円形（タブ用、角は透過）
  await sharp(Buffer.from(circleSvg)).resize(512, 512).png().toFile(path.join(PUBLIC, 'icon.png'));

  // apple-touch-icon.png — 角丸ベタ塗り
  await sharp(Buffer.from(squareSvg)).resize(180, 180).png().toFile(path.join(PUBLIC, 'apple-touch-icon.png'));

  // favicon.ico — 16/32/48 をまとめる
  const sizes = [16, 32, 48];
  const pngs = [];
  for (const size of sizes) {
    pngs.push({ size, data: await pngFromSvg(circleSvg, size) });
  }
  await writeFile(path.join(PUBLIC, 'favicon.ico'), buildIco(pngs));

  // PWA / 共有用 SVG
  await writeFile(path.join(ICONS, 'icon-192.svg'), squareSvg);
  await writeFile(path.join(ICONS, 'icon-512.svg'), squareSvg);
  await writeFile(path.join(ICONS, 'icon-maskable.svg'), maskableSvg);

  console.log('icons generated: favicon.ico, icon.png, apple-touch-icon.png, icons/*.svg');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
