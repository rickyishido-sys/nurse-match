import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { MemberAvatar } from '@/components/connection/member-avatar';
import { MemberInsights } from '@/components/connection/member-insights';
import { MemberVisibleSocialLinks } from '@/components/connection/member-visible-social-links';
import { ReportButton } from '@/components/connection/report-button';
import { TrustBadgeList } from '@/components/connection/trust-badge';
import { Card } from '@/components/connection/ui';
import { LIFE_PHASE_LABEL, PURPOSE_LABEL, INTEREST_TAG_LABEL } from '@/lib/connection/data';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getMember } from '@/lib/connection/repo';
import { getVisibleSocialLinks } from '@/lib/connection/social-links';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = { params: Promise<{ memberId: string }> };

export default async function MemberProfilePage({ params }: PageProps) {
  const { memberId } = await params;
  const viewer = await getHanakaiViewer();
  const viewerMemberId = await getViewerMemberId();
  const member = await getMember(memberId);
  if (!member || member.status === 'deleted') notFound();

  const isSelf = viewerMemberId === memberId;
  if (isSelf) {
    return notFound();
  }

  const visibleSocialLinks = getVisibleSocialLinks(member, viewerMemberId);
  const purposeLabels = member.purposes.map((p) => PURPOSE_LABEL[p]).filter(Boolean);
  const interestLabels = member.interestTags.map((t) => INTEREST_TAG_LABEL[t]).filter(Boolean);
  const canReport = !!viewerMemberId;

  return (
    <ConnectionShell viewer={viewer}>
      <div className='space-y-5'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <p className='text-[11px] font-medium tracking-[0.2em] text-[#6b6b6b]'>PROFILE</p>
            <h1 className='mt-1 text-xl font-semibold text-[#1a1a1a]'>{member.nickname}</h1>
          </div>
          <ReportButton
            target={{
              targetType: 'profile',
              targetMemberId: member.id,
              label: `${member.nickname} のプロフィール`,
            }}
            canReport={canReport}
            loginNext={`/profile/${member.id}`}
          />
        </div>

        <Card>
          <div className='flex gap-4'>
            <MemberAvatar member={member} size={72} />
            <div className='min-w-0 flex-1'>
              <TrustBadgeList member={member} />
              <p className='mt-2 text-xs text-[#6b6b6b]'>
                {member.age ? `${member.age}歳` : ''}
                {member.area ? ` · ${member.area}` : ''}
                {member.occupation ? ` · ${member.occupation}` : ''}
              </p>
              {member.bio.trim() ? (
                <p className='mt-2 text-sm leading-7 text-[#4a4a4a]'>{member.bio}</p>
              ) : null}
            </div>
          </div>
        </Card>

        {visibleSocialLinks.length > 0 ? (
          <Card>
            <h2 className='mb-3 text-sm font-semibold text-[#1a1a1a]'>SNS</h2>
            <MemberVisibleSocialLinks links={visibleSocialLinks} />
          </Card>
        ) : null}

        <Card>
          <h2 className='mb-3 text-sm font-semibold text-[#1a1a1a]'>Connection情報</h2>
          {purposeLabels.length > 0 ? (
            <p className='text-xs text-[#6b6b6b]'>
              <span className='font-medium text-[#9a9a9a]'>目的: </span>
              {purposeLabels.join('、')}
            </p>
          ) : null}
          {interestLabels.length > 0 ? (
            <p className='mt-2 text-xs text-[#6b6b6b]'>
              <span className='font-medium text-[#9a9a9a]'>興味: </span>
              {interestLabels.join('、')}
            </p>
          ) : null}
          <p className='mt-2 text-xs text-[#6b6b6b]'>
            <span className='font-medium text-[#9a9a9a]'>ライフフェーズ: </span>
            {LIFE_PHASE_LABEL[member.lifePhase]}
          </p>
          <div className='mt-4'>
            <MemberInsights member={member} variant='compact' />
          </div>
        </Card>

        <Link
          href='/events'
          className='inline-block text-xs font-semibold text-[#1f5d4f] underline-offset-2 hover:underline'
        >
          ← イベント一覧へ
        </Link>
      </div>
    </ConnectionShell>
  );
}
