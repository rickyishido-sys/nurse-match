import type { ConnectionMember, MemberSocialLink } from '@/lib/connection/types';
import { sanitizeSocialUrl } from '@/lib/connection/social-link-normalize';

/** 公開プロフィール向け — 本人は全件、他者は公開ONのみ。危険URLは除外 */
export function getVisibleSocialLinks(
  member: Pick<ConnectionMember, 'id' | 'socialLinks'>,
  viewerMemberId: string | null,
): MemberSocialLink[] {
  const isOwner = Boolean(viewerMemberId && viewerMemberId === member.id);
  const source = isOwner ? member.socialLinks : member.socialLinks.filter((link) => link.isVisibleOnProfile);

  const seen = new Set<string>();
  const result: MemberSocialLink[] = [];

  for (const link of source) {
    const sanitized = sanitizeSocialUrl(link.platform, link.url);
    if (!sanitized) continue;
    if (seen.has(sanitized.platform)) continue;
    seen.add(sanitized.platform);
    result.push({
      ...link,
      platform: sanitized.platform,
      url: sanitized.url,
    });
  }

  return result;
}
