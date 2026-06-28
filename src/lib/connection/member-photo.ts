import type { ConnectionMember, MemberProfilePhoto } from '@/lib/connection/types';

/** sort_order 昇順で並べ替え */
export function sortMemberPhotos(photos: MemberProfilePhoto[]): MemberProfilePhoto[] {
  return [...photos].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** メインプロフィール画像（1枚目 → avatarUrl フォールバック） */
export function memberMainPhotoUrl(member: Pick<ConnectionMember, 'avatarUrl' | 'photos'>): string {
  const sorted = sortMemberPhotos(member.photos ?? []);
  return sorted[0]?.url || member.avatarUrl || '';
}
