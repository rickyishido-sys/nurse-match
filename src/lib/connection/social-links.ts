import type { ConnectionMember, MemberSocialLink } from '@/lib/connection/types';

/** 公開プロフィール向け — 本人は全件、他者は公開ONのみ */
export function getVisibleSocialLinks(
  member: Pick<ConnectionMember, 'id' | 'socialLinks'>,
  viewerMemberId: string | null,
): MemberSocialLink[] {
  const isOwner = Boolean(viewerMemberId && viewerMemberId === member.id);
  if (isOwner) return member.socialLinks;
  return member.socialLinks.filter((link) => link.isVisibleOnProfile);
}
