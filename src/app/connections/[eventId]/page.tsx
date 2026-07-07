import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { ConnectionMessageButton } from '@/components/connection/message-button';
import { MemberAvatar } from '@/components/connection/member-avatar';
import { MemberInsights } from '@/components/connection/member-insights';
import { MemberVisibleSocialLinks } from '@/components/connection/member-visible-social-links';
import { TrustBadgeList } from '@/components/connection/trust-badge';
import { ReportButton } from '@/components/connection/report-button';
import { Card, Chip } from '@/components/connection/ui';
import { followMemberAction } from '@/lib/connection/actions';
import { canViewConnectionPage, getEvent, getEventMembers, getMember } from '@/lib/connection/repo';
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
  const followedId = typeof sp.followed === 'string' ? sp.followed : null;
  const messagedId = typeof sp.messaged === 'string' ? sp.messaged : null;
  const followedMember = followedId ? await getMember(followedId) : null;
  const messagedMember = messagedId ? await getMember(messagedId) : null;

  if (!canView) {
    return (
      <ConnectionShell viewer={viewer}>
        <Card className='text-center'>
          <p className='text-sm font-semibold text-[#1a1a1a]'>参加者限定のページです</p>
          <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>
            イベント終了後、確定参加者だけがこのConnectionページを閲覧できます。
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
          <p className='text-[11px] font-medium tracking-[0.2em] text-[#6b6b6b]'>CONNECTION</p>
          <h1 className='mt-1 text-xl font-semibold text-[#1a1a1a]'>{event.title}</h1>
          <p className='mt-2 text-sm leading-7 text-[#6b6b6b]'>
            このイベントに参加した{members.length}人だけが閲覧できます。フォローやメッセージで、次のConnectionへ。
          </p>
          <Link
            href={`/groups/${eventId}`}
            className='mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1f5d4f] underline-offset-2 hover:underline'
          >
            参加者グループを見る →
          </Link>
        </div>

        {followedId ? (
          <p className='rounded-2xl border border-[#ebe9e4] bg-white px-4 py-3 text-xs text-[#4a4a4a]'>
            {followedMember?.nickname ?? 'メンバー'}さんをフォローしました。
          </p>
        ) : null}

        {messagedId ? (
          <p className='rounded-2xl border border-[#ebe9e4] bg-white px-4 py-3 text-xs text-[#4a4a4a]'>
            {messagedMember?.nickname ?? 'メンバー'}さんにメッセージを送りました。
          </p>
        ) : null}

        <div className='space-y-4'>
          {members.map((member) => {
            const isSelf = member.id === viewerMemberId;
            const visibleSocialLinks = getVisibleSocialLinks(member, viewerMemberId);
            return (
              <Card key={member.id}>
                <div className='flex gap-4'>
                  <MemberAvatar member={member} size={64} />
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <Link href={`/profile/${member.id}`} className='text-sm font-semibold text-[#1a1a1a] hover:underline'>
                        {member.nickname}
                      </Link>
                      {isSelf ? <Chip tone='muted'>あなた</Chip> : null}
                    </div>
                    <TrustBadgeList member={member} className='mt-1.5' />
                    <p className='text-xs text-[#6b6b6b]'>{member.age}歳 · {member.area} · {member.occupation}</p>
                    <p className='mt-2 text-xs leading-6 text-[#4a4a4a]'>{member.bio}</p>
                    {visibleSocialLinks.length > 0 ? (
                      <div className='mt-3'>
                        <MemberVisibleSocialLinks links={visibleSocialLinks} />
                      </div>
                    ) : null}
                    <div className='mt-3'>
                      <MemberInsights member={member} variant='compact' />
                    </div>
                  </div>
                </div>

                {!isSelf ? (
                  <div className='mt-4 space-y-3'>
                    <div className='grid grid-cols-2 gap-2'>
                      <form action={followMemberAction}>
                        <input type='hidden' name='memberId' value={member.id} />
                        <input type='hidden' name='eventId' value={eventId} />
                        <button type='submit' className='h-10 w-full rounded-full border border-[#1a1a1a] text-xs font-semibold text-[#1a1a1a]'>
                          フォロー
                        </button>
                      </form>
                      <ConnectionMessageButton memberId={member.id} memberName={member.nickname} eventId={eventId} />
                    </div>
                    <div className='text-right'>
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
