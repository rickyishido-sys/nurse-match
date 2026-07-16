import 'server-only';

import {
  evaluateDocumentLikeness,
  type IdentityDocumentCheckResult,
} from '@/lib/connection/identity-document-check';

/** サーバー上で画像ファイルを簡易判定（PDFはスキップ） */
export async function checkIdentityDocumentFileServer(
  file: File,
): Promise<IdentityDocumentCheckResult> {
  if (!file.type.startsWith('image/')) {
    return { ok: true };
  }
  try {
    const sharp = (await import('sharp')).default;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { data, info } = await sharp(buffer)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true });
    let light = 0;
    let saturated = 0;
    const total = info.width * info.height;
    for (let i = 0; i < data.length; i += 3) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum > 200 || (lum > 160 && max - min < 35)) light += 1;
      if (max - min > 60 && max > 100) saturated += 1;
    }
    const meta = await sharp(buffer).metadata();
    return evaluateDocumentLikeness({
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      aspectRatio: (meta.width ?? 1) / (meta.height ?? 1),
      lightPixelRatio: light / total,
      saturatedPixelRatio: saturated / total,
    });
  } catch {
    return { ok: true };
  }
}
