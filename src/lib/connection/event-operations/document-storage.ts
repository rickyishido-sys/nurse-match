import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const BUCKET = 'event-revenue-documents';
const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']);

function randomId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export async function uploadRevenueDocument(eventId: string, file: File) {
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_BYTES) return null;
  if (!ALLOWED.has(file.type)) return null;

  const sb = createAdminSupabaseClient() ?? (await createServerSupabaseClient());
  if (!sb) return null;

  const ext = file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1] ?? 'bin';
  const storagePath = `${eventId}/${randomId()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await sb.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    console.error('HANAKAI_REVENUE_DOC_UPLOAD_FAILED', error.message);
    return null;
  }

  return {
    storagePath,
    fileName: file.name,
    mimeType: file.type,
  };
}

export async function getSignedDocumentUrl(storagePath: string, expiresIn = 3600): Promise<string | null> {
  const sb = createAdminSupabaseClient();
  if (!sb || !storagePath) return null;
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(storagePath, expiresIn);
  if (error) return null;
  return data?.signedUrl ?? null;
}
