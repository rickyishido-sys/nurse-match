import { STORAGE_BUCKETS, USE_MOCK_DATA } from '@/lib/config';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function uploadDocument(file: File | null, userId: string, kind: keyof typeof STORAGE_BUCKETS) {
  if (!file || file.size === 0) return null;

  const bucket = STORAGE_BUCKETS[kind];
  const path = `${userId}/${Date.now()}-${file.name}`;

  if (USE_MOCK_DATA) {
    return `mock://${bucket}/${path}`;
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) throw new Error('SUPABASE_SERVICE_ROLE_KEY が未設定です');

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return `${bucket}/${path}`;
}
