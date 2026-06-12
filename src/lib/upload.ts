import { STORAGE_BUCKETS, USE_MOCK_DATA } from '@/lib/config';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function uploadDocument(file: File | null, userId: string, kind: keyof typeof STORAGE_BUCKETS) {
  if (!file || file.size === 0) return null;
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('10MB以下のファイルを選択してください');
  }

  const bucket = STORAGE_BUCKETS[kind];
  const path = `${userId}/${Date.now()}-${file.name}`;

  if (USE_MOCK_DATA) {
    return `mock://${bucket}/${path}`;
  }

  console.log('REGISTER_DETAILS_STORAGE_CLIENT_KEY', {
    clientType: 'admin',
    keyName: 'SUPABASE_SERVICE_ROLE_KEY',
    fallbackAnonKeyName: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  });

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    console.error('REGISTER_UPLOAD_ERROR', {
      reason: 'missing_admin_client',
      kind,
      userId,
    });
    console.error('REGISTER_DETAILS_STORAGE_UPLOAD_ERROR', {
      reason: 'missing_admin_client',
      userId,
      kind,
      bucket,
      path,
      fileName: file.name,
      fileSize: file.size,
    });
    throw new Error('SUPABASE_SERVICE_ROLE_KEY が未設定です');
  }

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    const isInvalidCompactJws = error.message.toLowerCase().includes('invalid compact jws');
    if (isInvalidCompactJws) {
      console.warn('REGISTER_UPLOAD_FALLBACK_START', {
        reason: 'invalid_compact_jws',
        kind,
        userId,
        bucket,
        path,
      });
      const fallbackClient = await createServerSupabaseClient();
      if (fallbackClient) {
        const { data: fallbackAuthData, error: fallbackAuthError } = await fallbackClient.auth.getUser();
        console.log('REGISTER_UPLOAD_FALLBACK_AUTH', {
          hasSessionUser: Boolean(fallbackAuthData.user),
          sessionUserId: fallbackAuthData.user?.id ?? null,
          authErrorMessage: fallbackAuthError?.message ?? null,
        });
        const { error: fallbackError } = await fallbackClient.storage.from(bucket).upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (!fallbackError) {
          console.log('REGISTER_UPLOAD_FALLBACK_SUCCESS', {
            kind,
            userId,
            bucket,
            path,
            clientType: 'session',
          });
          return `${bucket}/${path}`;
        }
        console.error('REGISTER_UPLOAD_FALLBACK_ERROR', {
          kind,
          userId,
          message: fallbackError.message,
          code: fallbackError.name,
        });
      } else {
        console.error('REGISTER_UPLOAD_FALLBACK_ERROR', {
          kind,
          userId,
          message: 'missing_session_client',
          code: null,
        });
      }
    }
    console.error('REGISTER_UPLOAD_ERROR', {
      reason: 'upload_failed',
      kind,
      userId,
      message: error.message,
    });
    console.error('REGISTER_DETAILS_STORAGE_UPLOAD_ERROR', {
      reason: 'upload_failed',
      userId,
      kind,
      bucket,
      path,
      fileName: file.name,
      fileSize: file.size,
      message: error.message,
      code: error.name,
    });
    throw new Error(error.message);
  }

  return `${bucket}/${path}`;
}
