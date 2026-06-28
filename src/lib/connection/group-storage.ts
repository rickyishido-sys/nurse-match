import sharp from 'sharp';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const BUCKET = 'group-photos';
const MAX_EDGE = 1200;
const WEBP_QUALITY = 82;
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 10;

function randomId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export async function uploadGroupPhotos(groupId: string, files: File[]): Promise<{ url: string; storagePath: string }[]> {
  const sb = await createServerSupabaseClient();
  if (!sb) return [];

  const valid = files
    .filter((f): f is File => f instanceof File && f.size > 0)
    .filter((f) => f.type.startsWith('image/') && f.size <= MAX_BYTES)
    .slice(0, MAX_FILES);

  const out: { url: string; storagePath: string }[] = [];
  for (const file of valid) {
    const input = Buffer.from(await file.arrayBuffer());
    const compressed = await sharp(input)
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const storagePath = `${groupId}/${randomId()}.webp`;
    const { error } = await sb.storage.from(BUCKET).upload(storagePath, compressed, {
      contentType: 'image/webp',
      upsert: false,
    });
    if (error) {
      console.error('HANAKAI_GROUP_PHOTO_UPLOAD_FAILED', { message: error.message });
      continue;
    }
    const { data } = sb.storage.from(BUCKET).getPublicUrl(storagePath);
    if (data?.publicUrl) out.push({ url: data.publicUrl, storagePath });
  }
  return out;
}
