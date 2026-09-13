import { STORAGE_BUCKETS, USE_MOCK_DATA } from '@/lib/config';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function extensionForUpload(file: File, kind: keyof typeof STORAGE_BUCKETS): string {
  const fromType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  };
  if (fromType[file.type]) return fromType[file.type];
  const nameExt = file.name.split('.').pop()?.toLowerCase();
  if (nameExt && /^[a-z0-9]{1,8}$/.test(nameExt)) return nameExt;
  return 'bin';
}

export async function uploadDocument(file: File | null, userId: string, kind: keyof typeof STORAGE_BUCKETS) {
  if (!file || file.size === 0) return null;
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('10MB以下のファイルを選択してください');
  }

  const bucket = STORAGE_BUCKETS[kind];
  // Avoid putting original filenames (often PII) into storage paths.
  const ext = extensionForUpload(file, kind);
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  if (USE_MOCK_DATA) {
    return `mock://${bucket}/${path}`;
  }

  if (kind !== 'identity') {
    console.log('REGISTER_DETAILS_STORAGE_CLIENT_KEY', {
      clientType: 'admin',
      keyName: 'SUPABASE_SERVICE_ROLE_KEY',
      fallbackAnonKeyName: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    });
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    console.error('REGISTER_UPLOAD_ERROR', {
      reason: 'missing_admin_client',
      kind,
      userId,
    });
    throw new Error('SUPABASE_SERVICE_ROLE_KEY が未設定です');
  }

  const startedAt = Date.now();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) {
    const isInvalidCompactJws = error.message.toLowerCase().includes('invalid compact jws');
    if (isInvalidCompactJws) {
      console.warn('REGISTER_UPLOAD_FALLBACK_START', {
        reason: 'invalid_compact_jws',
        kind,
        userId,
        bucket,
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
          contentType: file.type || undefined,
        });
        if (!fallbackError) {
          console.log('REGISTER_UPLOAD_FALLBACK_SUCCESS', {
            kind,
            userId,
            bucket,
            clientType: 'session',
            elapsedMs: Date.now() - startedAt,
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
      elapsedMs: Date.now() - startedAt,
      fileSize: file.size,
    });
    throw new Error(error.message);
  }

  if (kind === 'identity') {
    console.log('CONNECTION_IDENTITY_STORAGE_UPLOAD_OK', {
      userId,
      elapsedMs: Date.now() - startedAt,
      fileSize: file.size,
    });
  }

  return `${bucket}/${path}`;
}
