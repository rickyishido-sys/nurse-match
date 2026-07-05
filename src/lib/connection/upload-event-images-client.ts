'use client';

import { createClient } from '@/lib/supabase/client';

const BUCKET = 'event-images';
const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function randomId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

/** ブラウザから event-images へ直接アップロード（Server Action の multipart 送信を避ける） */
export async function uploadEventImagesClient(files: File[]): Promise<string[]> {
  const sb = createClient();
  if (!sb) return [];

  const valid = files
    .filter((f) => f.size > 0)
    .filter((f) => EXT_BY_TYPE[f.type] && f.size <= MAX_BYTES)
    .slice(0, MAX_FILES);

  const urls: string[] = [];
  for (const file of valid) {
    const ext = EXT_BY_TYPE[file.type] ?? 'jpg';
    const path = `${randomId()}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      console.error('HANAKAI_EVENT_IMAGE_CLIENT_UPLOAD_FAILED', { message: error.message });
      continue;
    }
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    if (data?.publicUrl) urls.push(data.publicUrl);
  }
  return urls;
}
