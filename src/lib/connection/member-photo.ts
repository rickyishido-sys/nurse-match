import {
  FEMALE_PROFILE_SAMPLE,
  MALE_PROFILE_SAMPLE,
  resolveFixedSampleAvatarUrl,
} from '@/lib/connection/mock-profile-assets';
import type { ConnectionMember, MemberProfilePhoto } from '@/lib/connection/types';

function normalizeAvatarUrl(url: string, gender?: ConnectionMember['gender']): string {
  return resolveFixedSampleAvatarUrl(url, gender);
}

/** sort_order 昇順で並べ替え */
export function sortMemberPhotos(photos: MemberProfilePhoto[]): MemberProfilePhoto[] {
  return [...photos].sort((a, b) => a.sortOrder - b.sortOrder);
}

type MemberPhotoFields = Pick<ConnectionMember, 'avatarUrl' | 'photos'> & {
  gender?: ConnectionMember['gender'];
};

function resolveStoredPhotoUrl(member: MemberPhotoFields): string {
  const sorted = sortMemberPhotos(member.photos ?? []);
  const raw = sorted[0]?.url?.trim() || member.avatarUrl?.trim() || '';
  return normalizeAvatarUrl(raw, member.gender);
}

/** 写真未設定時は性別に応じた固定サンプルへフォールバック */
export function memberMainPhotoUrl(member: MemberPhotoFields): string {
  const url = resolveStoredPhotoUrl(member);
  if (url) return url;
  if (member.gender === 'male') return MALE_PROFILE_SAMPLE;
  if (member.gender === 'female') return FEMALE_PROFILE_SAMPLE;
  return '';
}

export function memberHasProfilePhotos(member: MemberPhotoFields): boolean {
  return Boolean(memberMainPhotoUrl(member).trim());
}

/** 管理画面など gender のみ分かる場合の表示用 URL */
export function resolveAvatarDisplayUrl(opts: {
  avatarUrl?: string | null;
  gender?: string | null;
}): string {
  const normalized = normalizeAvatarUrl(
    opts.avatarUrl?.trim() ?? '',
    opts.gender === 'male' || opts.gender === 'female' || opts.gender === 'other' ? opts.gender : undefined,
  );
  if (normalized) return normalized;
  if (opts.gender === 'male') return MALE_PROFILE_SAMPLE;
  if (opts.gender === 'female') return FEMALE_PROFILE_SAMPLE;
  return '';
}
