import sharp from 'sharp';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const BUCKET = 'profile-photos';
const MAX_EDGE = 1200;
const WEBP_QUALITY = 82;
const MAX_BYTES = 12 * 1024 * 1024;

export type UploadedProfilePhoto = { storagePath: string; url: string };

function randomId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

/** 長辺1200px・WebP に圧縮して profile-photos へ保存 */
export async function uploadProfilePhoto(memberId: string, file: File): Promise<UploadedProfilePhoto | null> {
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_BYTES) return null;

  const sb = await createServerSupabaseClient();
  if (!sb) return null;

  const input = Buffer.from(await file.arrayBuffer());
  const compressed = await sharp(input)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const storagePath = `${memberId}/${randomId()}.webp`;
  const { error } = await sb.storage.from(BUCKET).upload(storagePath, compressed, {
    contentType: 'image/webp',
    upsert: false,
  });
  if (error) {
    console.error('HANAKAI_PROFILE_PHOTO_UPLOAD_FAILED', { message: error.message });
    return null;
  }

  const { data } = sb.storage.from(BUCKET).getPublicUrl(storagePath);
  if (!data?.publicUrl) return null;
  return { storagePath, url: data.publicUrl };
}

export async function deleteProfilePhotoFile(storagePath: string): Promise<void> {
  if (!storagePath) return;
  const sb = await createServerSupabaseClient();
  if (!sb) return;
  const { error } = await sb.storage.from(BUCKET).remove([storagePath]);
  if (error) console.error('HANAKAI_PROFILE_PHOTO_DELETE_FAILED', { message: error.message });
}
