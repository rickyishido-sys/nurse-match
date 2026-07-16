import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { MemberAvatar } from '@/components/connection/member-avatar';
import { MemberInsights } from '@/components/connection/member-insights';
import { MemberSocialIcons } from '@/components/connection/member-social-icons';
import { IdentityVerifiedBadge } from '@/components/connection/identity-verified-badge';
import { TrustBadgeList } from '@/components/connection/trust-badge';
import { ReportButton } from '@/components/connection/report-button';
import { Card, Chip } from '@/components/connection/ui';
import { listBlockedMemberIds } from '@/lib/connection/block-repo';
import { BloomMemoryForm } from '@/components/connection/bloom-memory-form';
import { canViewConnectionPage, getEvent, getEventMembers } from '@/lib/connection/repo';
import { getBloomMemoryForEvent, recordEventJoinedTimeline } from '@/lib/connection/bloom-phase4';
import { getBloomMemorySkipCookie } from '@/lib/connection/bloom-phase4-actions';
import { getVisibleSocialLinks } from '@/lib/connection/social-links';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = {
  params: Promise<{ eventId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ConnectionPage({ params, searchParams }: PageProps) {
  const { eventId } = await params;
  const sp = searchParams ? await searchParams : {};
  const event = await getEvent(eventId);
  if (!event) notFound();

  const viewer = await getHanakaiViewer();
  const viewerMemberId = await getViewerMemberId();
  const canView = !!viewerMemberId && (await canViewConnectionPage(eventId, viewerMemberId));
  const members = await getEventMembers(eventId);
  const blockedIds = viewerMemberId ? new Set(await listBlockedMemberIds(viewerMemberId)) : new Set<string>();
  const memorySaved = typeof sp.memorySaved === 'string';

  if (canView && event.isPast && viewerMemberId) {
    await recordEventJoinedTimeline(viewerMemberId, eventId, event.title);
  }

  const existingMemory =
    canView && viewerMemberId ? await getBloomMemoryForEvent(viewerMemberId, eventId) : null;
  const memorySkipped = canView ? await getBloomMemorySkipCookie(eventId) : true;
  const showMemoryPrompt =
    canView && event.isPast && !existingMemory && !memorySkipped && !memorySaved;

  if (!canView) {
    return (
      <ConnectionShell viewer={viewer}>
        <Card className='text-center'>
          <p className='text-sm font-semibold text-[#1a1a1a]'>参加者限定のページです</p>
          <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>
            イベントに参加確定した方だけが、参加者一覧を閲覧できます。
          </p>
          <Link href='/events' className='mt-4 inline-block text-xs font-semibold text-[#1a1a1a] underline-offset-2 hover:underline'>
            イベント一覧へ
          </Link>
        </Card>
      </ConnectionShell>
    );
  }

  return (
    <ConnectionShell viewer={viewer}>
      <div className='space-y-6'>
        <div>
          <p className='text-[11px] font-medium tracking-[0.2em] text-[#6b6b6b]'>PARTICIPANTS</p>
          <h1 className='mt-1 text-xl font-semibold text-[#1a1a1a]'>{event.title}</h1>
          <p className='mt-2 text-sm leading-7 text-[#6b6b6b]'>
            このイベントに参加した{members.length}人のプロフィールを確認できます。気になる相手は通報・ブロックで距離を取れます。
          </p>
        </div>

        {memorySaved ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-xs text-[#1f5d4f]'>
            思い出のメモを保存しました。マイプロフィールでも確認できます。
          </p>
        ) : null}

        {showMemoryPrompt ? (
          <BloomMemoryForm eventId={eventId} eventTitle={event.title} variant='prompt' />
        ) : null}

        <div className='space-y-4'>
          {members
            .filter((member) => !blockedIds.has(member.id))
            .map((member) => {
            const isSelf = member.id === viewerMemberId;
            const visibleSocialLinks = getVisibleSocialLinks(member, viewerMemberId);
            return (
              <Card key={member.id}>
                <div className='flex gap-4'>
                  <MemberAvatar member={member} size={64} />
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Link href={`/profile/${member.id}`} className='text-sm font-semibold text-[#1a1a1a] hover:underline'>
                        {member.nickname}
                      </Link>
                      {isSelf ? <Chip tone='muted'>あなた</Chip> : null}
                      <IdentityVerifiedBadge member={member} />
                    </div>
                    <TrustBadgeList member={member} hideIdentity className='mt-1.5' />
                    <p className='text-xs text-[#6b6b6b]'>{member.age}歳 · {member.area} · {member.occupation}</p>
                    <p className='mt-2 text-xs leading-6 text-[#4a4a4a]'>{member.bio}</p>
                    {visibleSocialLinks.length > 0 ? (
                      <div className='mt-3'>
                        <MemberSocialIcons links={visibleSocialLinks} />
                      </div>
                    ) : null}
                    <div className='mt-3'>
                      <MemberInsights member={member} variant='compact' />
                    </div>
                  </div>
                </div>

                {!isSelf ? (
                  <div className='mt-4 text-right'>
                    <ReportButton
                      target={{
                        targetType: 'member',
                        targetMemberId: member.id,
                        label: `${member.nickname}（参加者）`,
                      }}
                      canReport={!!viewerMemberId}
                      loginNext={`/connections/${eventId}`}
                    />
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </div>
    </ConnectionShell>
  );
}
