import { MemberAvatar } from '@/components/connection/member-avatar';
import { IdentityVerifiedBadge } from '@/components/connection/identity-verified-badge';
import { MemberSocialIcons } from '@/components/connection/member-social-icons';
import { MemberTrustStatsPanel } from '@/components/connection/member-trust-stats-panel';
import { getMemberTrustStats } from '@/lib/connection/member-trust-stats';
import { getVisibleSocialLinks } from '@/lib/connection/social-links';
import { memberHasProfilePhotos } from '@/lib/connection/member-photo';
import type { ConnectionMember } from '@/lib/connection/types';

type Props = {
  member: ConnectionMember;
  viewerMemberId?: string | null;
  kicker?: string;
  showTrustStats?: boolean;
  avatarSize?: number;
  editPhotoHref?: string;
};

export function ProfileHeader({
  member,
  viewerMemberId = null,
  kicker,
  showTrustStats = true,
  avatarSize = 88,
  editPhotoHref,
}: Props) {
  const socialLinks = getVisibleSocialLinks(member, viewerMemberId).filter((l) => l.url.trim());
  const displaySocial =
    viewerMemberId === member.id ? socialLinks.filter((l) => l.isVisibleOnProfile) : socialLinks;
  const stats = getMemberTrustStats(member);

  return (
    <section className='rounded-3xl border border-[#ebe9e4] bg-white px-5 py-6 sm:px-8'>
      <div className='flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left'>
        <MemberAvatar
          member={member}
          size={avatarSize}
          priority
          showEmptyPlaceholder={!memberHasProfilePhotos(member)}
          editHref={editPhotoHref}
        />
        <div className='min-w-0 flex-1 space-y-2.5'>
          {kicker ? (
            <p className='text-[11px] font-semibold tracking-[0.2em] text-[#b8956a]'>{kicker}</p>
          ) : null}
          <h1 className='text-xl font-semibold tracking-tight text-[#1a1a1a] sm:text-2xl'>{member.nickname}</h1>
          <IdentityVerifiedBadge member={member} />
          {displaySocial.length > 0 ? (
            <MemberSocialIcons links={displaySocial} className='justify-center sm:justify-start' />
          ) : null}
          {showTrustStats ? <MemberTrustStatsPanel stats={stats} /> : null}
        </div>
      </div>
    </section>
  );
}
