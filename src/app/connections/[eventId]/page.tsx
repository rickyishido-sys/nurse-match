import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { MemberAvatar } from '@/components/connection/member-avatar';
import { MemberInsights } from '@/components/connection/member-insights';
import { IdentityVerifiedBadge } from '@/components/connection/identity-verified-badge';
import { TrustBadgeList } from '@/components/connection/trust-badge';
import { ReportButton } from '@/components/connection/report-button';
import { PrefetchRoutes } from '@/components/connection/prefetch-routes';
import { ReliableNavLink } from '@/components/connection/reliable-nav-link';
import { Card, Chip } from '@/components/connection/ui';
import { LoadingStatus } from '@/components/connection/ui/loading-status';
import { listHiddenMemberIdsForViewer } from '@/lib/connection/block-repo';
import { BloomMemoryForm } from '@/components/connection/bloom-memory-form';
import { getEvent, getMembersByConfirmedIds } from '@/lib/connection/repo';
import { getBloomMemoryForEvent, recordEventJoinedTimeline } from '@/lib/connection/bloom-phase4';
import { getBloomMemorySkipCookie } from '@/lib/connection/bloom-phase4-actions';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = {
  params: Promise<{ eventId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function MemoryPrompt({
  eventId,
  eventTitle,
  viewerMemberId,
  memorySaved,
}: {
  eventId: string;
  eventTitle: string;
  viewerMemberId: string;
  memorySaved: boolean;
}) {
  const [existingMemory, memorySkipped] = await Promise.all([
    getBloomMemoryForEvent(viewerMemberId, eventId),
    getBloomMemorySkipCookie(eventId),
  ]);
  if (existingMemory || memorySkipped || memorySaved) return null;
  return <BloomMemoryForm eventId={eventId} eventTitle={eventTitle} variant='prompt' />;
}

async function ParticipantsSection({
  eventId,
  viewerMemberId,
  confirmedMemberIds,
}: {
  eventId: string;
  viewerMemberId: string;
  confirmedMemberIds: string[];
}) {
  // Reuse confirmed ids from getEvent — skip a second applications query.
  const [members, blockedIdList] = await Promise.all([
    getMembersByConfirmedIds(confirmedMemberIds),
    listHiddenMemberIdsForViewer(viewerMemberId),
  ]);
  const blockedIds = new Set(blockedIdList);
  const visibleMembers = members.filter((member) => !blockedIds.has(member.id));
  const prefetchHrefs = visibleMembers
    .filter((m) => m.id !== viewerMemberId)
    .slice(0, 8)
    .map((m) => `/profile/${m.id}?returnTo=${encodeURIComponent(`/connections/${eventId}`)}`);

  return (
    <>
      <PrefetchRoutes hrefs={prefetchHrefs} />
      <p className='text-sm leading-7 text-[#6b6b6b]'>
        このイベントに参加した{members.length}人のプロフィールを確認できます。気になる相手は通報・ブロックで距離を取れます。
      </p>
      <div className='mt-4 space-y-4'>
        {visibleMembers.map((member) => {
          const isSelf = member.id === viewerMemberId;
          const profileHref = `/profile/${member.id}?returnTo=${encodeURIComponent(`/connections/${eventId}`)}`;
          return (
            <Card key={member.id}>
              <div className='flex gap-4'>
                <MemberAvatar member={member} size={64} />
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <ReliableNavLink href={profileHref} className='text-sm font-semibold text-[#1a1a1a] hover:underline'>
                      {member.nickname}
                    </ReliableNavLink>
                    {isSelf ? <Chip tone='muted'>あなた</Chip> : null}
                    <IdentityVerifiedBadge member={member} />
                  </div>
                  <TrustBadgeList member={member} hideIdentity className='mt-1.5' />
                  <p className='text-xs text-[#6b6b6b]'>
                    {member.age}歳 · {member.area} · {member.occupation}
                  </p>
                  <p className='mt-2 text-xs leading-6 text-[#4a4a4a]'>{member.bio}</p>
                  <div className='mt-3'>
                    <MemberInsights member={member} variant='compact' />
                  </div>
                </div>
              </div>

              {!isSelf ? (
                <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
                  <ReliableNavLink
                    href={profileHref}
                    className='inline-flex min-h-[44px] items-center rounded-full border border-[#1f5d4f] bg-white px-4 text-xs font-semibold text-[#1f5d4f]'
                  >
                    プロフィールを見る →
                  </ReliableNavLink>
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
    </>
  );
}

export default async function ConnectionPage({ params, searchParams }: PageProps) {
  const { eventId } = await params;
  const [sp, viewer, viewerMemberId, event] = await Promise.all([
    searchParams ? searchParams : Promise.resolve({} as Record<string, string | string[] | undefined>),
    getHanakaiViewer(),
    getViewerMemberId(),
    getEvent(eventId),
  ]);
  if (!event) notFound();

  const memorySaved = typeof sp.memorySaved === 'string';
  const blockedDone = sp.blocked === '1';

  // Inline canView — event already loaded (avoids a redundant getEvent hop).
  const canView = !!viewerMemberId && event.isPast && event.confirmedMemberIds.includes(viewerMemberId);

  if (canView && event.isPast && viewerMemberId) {
    void recordEventJoinedTimeline(viewerMemberId, eventId, event.title).catch(() => {});
  }

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
        </div>

        {blockedDone ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-xs text-[#1f5d4f]'>
            ブロックしました。対象の参加者はこの一覧から非表示になります。
          </p>
        ) : null}

        {memorySaved ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-xs text-[#1f5d4f]'>
            思い出のメモを保存しました。マイプロフィールでも確認できます。
          </p>
        ) : null}

        {event.isPast && viewerMemberId ? (
          <Suspense fallback={null}>
            <MemoryPrompt
              eventId={eventId}
              eventTitle={event.title}
              viewerMemberId={viewerMemberId}
              memorySaved={memorySaved}
            />
          </Suspense>
        ) : null}

        <Suspense
          fallback={
            <div className='flex flex-col items-center gap-3 py-10'>
              <LoadingStatus variant='block' label='参加者を読み込み中' />
            </div>
          }
        >
          <ParticipantsSection eventId={eventId} viewerMemberId={viewerMemberId!} confirmedMemberIds={event.confirmedMemberIds} />
        </Suspense>
      </div>
    </ConnectionShell>
  );
}
