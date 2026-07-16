/**
 * 本人確認書類の最低限の画像判定（クライアント・サーバー共通ヒューリスティック）
 * 完璧なOCRは行わず、明らかに書類でない画像を弾く。
 */

export type IdentityDocumentCheckResult =
  | { ok: true }
  | { ok: false; reason: 'not_image' | 'too_small' | 'panorama' | 'low_document_likeness' };

export type ImageSampleStats = {
  width: number;
  height: number;
  aspectRatio: number;
  lightPixelRatio: number;
  saturatedPixelRatio: number;
};

/** ピクセルサンプルから書類らしさを推定 */
export function evaluateDocumentLikeness(stats: ImageSampleStats): IdentityDocumentCheckResult {
  if (stats.width < 320 || stats.height < 240) {
    return { ok: false, reason: 'too_small' };
  }

  const aspect = stats.aspectRatio;
  if (aspect > 2.8 || aspect < 0.35) {
    return { ok: false, reason: 'panorama' };
  }

  // 書類は白〜グレー背景が多い。風景・ペットは高彩度ピクセルが多くなりやすい
  if (stats.lightPixelRatio < 0.12 && stats.saturatedPixelRatio > 0.45) {
    return { ok: false, reason: 'low_document_likeness' };
  }

  if (stats.saturatedPixelRatio > 0.62 && stats.lightPixelRatio < 0.2) {
    return { ok: false, reason: 'low_document_likeness' };
  }

  return { ok: true };
}

export const IDENTITY_DOCUMENT_REJECT_MESSAGE =
  '本人確認書類として認識できませんでした。運転免許証・マイナンバーカード・パスポートなどを撮影してください。';

/** ブラウザ上で画像ファイルを簡易判定 */
export async function checkIdentityDocumentFileClient(file: File): Promise<IdentityDocumentCheckResult> {
  if (!file.type.startsWith('image/')) {
    return { ok: true };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement('canvas');
        const maxSide = 400;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ ok: true });
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let light = 0;
        let saturated = 0;
        const total = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum > 200 || (lum > 160 && max - min < 35)) light += 1;
          if (max - min > 60 && max > 100) saturated += 1;
        }
        resolve(
          evaluateDocumentLikeness({
            width: img.width,
            height: img.height,
            aspectRatio: img.width / img.height,
            lightPixelRatio: light / total,
            saturatedPixelRatio: saturated / total,
          }),
        );
      } catch {
        resolve({ ok: true });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: false, reason: 'not_image' });
    };
    img.src = url;
  });
}
