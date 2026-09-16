import { resolveFixedSampleAvatarUrl } from '@/lib/connection/mock-profile-assets';
import type { ConnectionMember, MemberProfilePhoto } from '@/lib/connection/types';

/**
 * Gender / nickname から自動割当していた人物サンプル。
 * 未登録時の表示には使わない。DB に残っていても本人アップロードとはみなさない。
 */
const GENDER_FALLBACK_SAMPLE_URLS = new Set([
  '/images/avatars/ken.webp',
  '/images/avatars/aoi.webp',
  '/images/profile-sample.webp',
  '/images/profile-sample-male.webp',
]);

const STOCK_FACE_HOST = /randomuser\.me|pravatar\.cc|i\.pravatar|picsum\.photos/i;

type MemberPhotoFields = Pick<ConnectionMember, 'avatarUrl' | 'photos'> & {
  gender?: ConnectionMember['gender'];
};

/** sort_order 昇順で並べ替え */
export function sortMemberPhotos(photos: MemberProfilePhoto[]): MemberProfilePhoto[] {
  return [...photos].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function isSystemPersonPlaceholderUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim() ?? '';
  if (!trimmed) return true;
  if (GENDER_FALLBACK_SAMPLE_URLS.has(trimmed)) return true;
  if (STOCK_FACE_HOST.test(trimmed)) return true;
  return false;
}

/** 本人がアプリからアップロードした写真（Supabase profile-photos） */
export function isLikelyUserUploadedPhotoUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim() ?? '';
  if (!trimmed) return false;
  return /\/storage\/v1\/object\/public\/profile-photos\//i.test(trimmed);
}

function firstStoredRawUrl(member: MemberPhotoFields): string {
  const sorted = sortMemberPhotos(member.photos ?? []);
  return sorted[0]?.url?.trim() || member.avatarUrl?.trim() || '';
}

/**
 * 表示してよい本人写真 URL。未登録・システム人物プレースホルダは空文字。
 * 性別・名前による人物写真フォールバックはしない。
 */
export function memberMainPhotoUrl(member: MemberPhotoFields): string {
  const raw = firstStoredRawUrl(member);
  const normalized = resolveFixedSampleAvatarUrl(raw);
  if (!normalized || isSystemPersonPlaceholderUrl(normalized)) return '';
  return normalized;
}

export function memberHasProfilePhotos(member: MemberPhotoFields): boolean {
  return Boolean(memberMainPhotoUrl(member));
}

/** 管理画面など gender のみ分かる場合の表示用 URL（性別フォールバックなし） */
export function resolveAvatarDisplayUrl(opts: {
  avatarUrl?: string | null;
  gender?: string | null;
}): string {
  return memberMainPhotoUrl({
    avatarUrl: opts.avatarUrl ?? '',
    photos: [],
  });
}
