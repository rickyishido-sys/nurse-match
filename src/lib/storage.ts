import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const KNOWN_BUCKETS = new Set(['profile-images', 'identity-documents', 'nurse-documents']);

function parseStorageRef(ref: string | null | undefined) {
  if (!ref || ref.startsWith('http://') || ref.startsWith('https://') || ref.startsWith('mock://')) return null;
  const [bucket, ...rest] = ref.split('/');
  if (!bucket || rest.length === 0) return null;
  if (!KNOWN_BUCKETS.has(bucket)) return null;
  return { bucket, path: rest.join('/') };
}

export async function getSignedObjectUrl(ref: string | null | undefined, expiresIn = 300) {
  if (!ref) return null;
  if (ref.startsWith('http://') || ref.startsWith('https://') || ref.startsWith('mock://')) return ref;

  const parsed = parseStorageRef(ref);
  if (!parsed) return ref;

  const admin = createAdminSupabaseClient();
  if (!admin) return ref;

  const { data, error } = await admin.storage.from(parsed.bucket).createSignedUrl(parsed.path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}

export async function getSignedProfileImageUrl(ref: string | null | undefined) {
  return getSignedObjectUrl(ref, 60 * 60);
}

export async function getAdminSignedDocumentUrl(ref: string | null | undefined, isAdmin: boolean) {
  if (!isAdmin) return null;
  return getSignedObjectUrl(ref, 60 * 5);
}
