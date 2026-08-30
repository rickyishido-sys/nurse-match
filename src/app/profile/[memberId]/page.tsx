import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { ProfileHeader } from '@/components/connection/profile-header';
import { MemberInsights } from '@/components/connection/member-insights';
import { ReportButton } from '@/components/connection/report-button';
import { BlockMemberButton } from '@/components/connection/block-member-button';
import { TrustBadgeList } from '@/components/connection/trust-badge';
import { BloomCardPublic } from '@/components/connection/bloom-card';
import { BloomPhase4Panel } from '@/components/connection/bloom-phase4-panel';
import { Card } from '@/components/connection/ui';
import { getBloomProfile } from '@/lib/connection/bloom-profile';
import { toPublicBloomProfile } from '@/lib/connection/bloom-profile-types';
import {
  getBloomPhase4Settings,
  listBloomMemories,
  listBloomTimeline,
} from '@/lib/connection/bloom-phase4';
import { filterPublicMemories, filterPublicTimeline } from '@/lib/connection/bloom-phase4-types';
import { LIFE_PHASE_LABEL, PURPOSE_LABEL, INTEREST_TAG_LABEL } from '@/lib/connection/data';
import { getViewerMemberId } from '@/lib/connection/identity';
import { isMemberBlocked } from '@/lib/connection/block-repo';
import { getMember } from '@/lib/connection/repo';
import { getPublicTrustBadges } from '@/lib/connection/trust';
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

  if (viewerMemberId && (await isMemberBlocked(viewerMemberId, memberId) || await isMemberBlocked(memberId, viewerMemberId))) {
    return notFound();
  }

  const purposeLabels = member.purposes.map((p) => PURPOSE_LABEL[p]).filter(Boolean);
  const interestLabels = member.interestTags.map((t) => INTEREST_TAG_LABEL[t]).filter(Boolean);
  const canReport = !!viewerMemberId;
  const bloomRaw = await getBloomProfile(memberId);
  const publicBloom = toPublicBloomProfile(bloomRaw, false);
  const phase4Settings = await getBloomPhase4Settings(memberId);
  const timelineRaw = await listBloomTimeline(memberId);
  const memoriesRaw = await listBloomMemories(memberId);
  const publicTimeline = phase4Settings.showTimeline ? filterPublicTimeline(timelineRaw) : undefined;
  const publicMemories = phase4Settings.showMemories ? filterPublicMemories(memoriesRaw) : undefined;
  const publicReflection =
    phase4Settings.showReflection && phase4Settings.aiReflection.trim()
      ? phase4Settings.aiReflection
      : undefined;

  return (
    <ConnectionShell viewer={viewer}>
      <div className='space-y-5'>
        <div className='flex items-start justify-end gap-3'>
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

        {viewerMemberId ? (
          <BlockMemberButton
            blockedMemberId={member.id}
            memberName={member.nickname}
            returnTo='/connections'
          />
        ) : null}

        <ProfileHeader member={member} viewerMemberId={viewerMemberId} kicker='PROFILE' />

        {getPublicTrustBadges(member).some((b) => b.key !== 'identity') ? (
          <TrustBadgeList member={member} hideIdentity />
        ) : null}

        <Card>
          <p className='text-xs text-[#6b6b6b]'>
            {member.age ? `${member.age}歳` : ''}
            {member.area ? ` · ${member.area}` : ''}
            {member.occupation ? ` · ${member.occupation}` : ''}
          </p>
          {member.bio.trim() ? (
            <p className='mt-2 text-sm leading-7 text-[#4a4a4a]'>{member.bio}</p>
          ) : null}
        </Card>

        {publicBloom ? <BloomCardPublic profile={publicBloom} /> : null}

        <BloomPhase4Panel
          mode='public'
          timeline={publicTimeline}
          memories={publicMemories}
          aiReflection={publicReflection}
        />

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
