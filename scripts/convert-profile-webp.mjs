#!/usr/bin/env node
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const src = path.join(root, 'public/images/profile-sample.jpg');
const dest = path.join(root, 'public/images/profile-sample.webp');

await sharp(src)
  .resize(256, 256, { fit: 'cover', position: 'top' })
  .webp({ quality: 82 })
  .toFile(dest);

const meta = await sharp(dest).metadata();
console.log(JSON.stringify({ ok: true, path: 'public/images/profile-sample.webp', width: meta.width, height: meta.height }));
