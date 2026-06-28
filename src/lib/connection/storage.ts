// HANAKAI Connection — event image uploads (Supabase Storage: event-images).
// 認証済み（匿名サインイン含む）セッションで public バケットへ保存し、公開URLを返す。
// Nurse Match 側の Storage / テーブルには一切触れない。
import { createServerSupabaseClient } from '@/lib/supabase/server';

const BUCKET = 'event-images';
const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB / 枚
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

/**
 * FormData から受け取った画像ファイル群を event-images バケットへ保存し、
 * 公開URLの配列を返す（最大5枚 / jpg・png・webp / 10MB以下のみ）。
 * 失敗したファイルはスキップし、保存できたぶんだけ返す（黒画面・例外を出さない）。
 */
export async function uploadEventImages(files: File[]): Promise<string[]> {
  const sb = await createServerSupabaseClient();
  if (!sb) return [];

  const valid = files
    .filter((f): f is File => f instanceof File && f.size > 0)
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
      console.error('HANAKAI_EVENT_IMAGE_UPLOAD_FAILED', { message: error.message });
      continue;
    }
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    if (data?.publicUrl) urls.push(data.publicUrl);
  }
  return urls;
}
