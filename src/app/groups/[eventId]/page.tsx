import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { GroupComposer } from '@/components/connection/groups/group-composer';
import { GroupFeedList } from '@/components/connection/groups/group-feed';
import { GroupPhotoGallery } from '@/components/connection/groups/group-photo-gallery';
import { MemberAvatar } from '@/components/connection/member-avatar';
import { Card, SectionHeading } from '@/components/connection/ui';
import { canAccessGroup } from '@/lib/connection/group-access';
import { formatEventDate } from '@/lib/connection/data';
import { listGroupPhotos, listGroupPosts, refreshGroupMembership } from '@/lib/connection/group-repo';
import { getEvent, getEventMembers, getMember } from '@/lib/connection/repo';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function GroupPage({ params }: PageProps) {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) notFound();

  const viewer = await getHanakaiViewer();
  const viewerMemberId = await getViewerMemberId();
  const access = await canAccessGroup(eventId, viewerMemberId);

  if (!access.ok) {
    return (
      <ConnectionShell viewer={viewer}>
        <div className='mx-auto max-w-md space-y-6 py-8 text-center'>
          <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef3ef] text-2xl text-[#1f5d4f]'>
            ✿
          </div>
          <div className='space-y-2'>
            <p className='text-sm font-semibold tracking-wide text-[#1a1a1a]'>参加者限定のグループです</p>
            <p className='text-xs leading-7 text-[#6b6b6b]'>
              このグループは、イベントの主催者・承認済み参加者・運営管理者のみが閲覧できます。
            </p>
          </div>
          <Link
            href={`/events/${eventId}`}
            className='inline-flex h-11 items-center justify-center rounded-full border border-[#1f5d4f] px-6 text-sm font-semibold text-[#1f5d4f]'
          >
            イベント詳細へ戻る
          </Link>
        </div>
      </ConnectionShell>
    );
  }

  const group = await refreshGroupMembership(eventId);
  if (!group) notFound();

  const [posts, photos, members] = await Promise.all([
    listGroupPosts(group.id),
    listGroupPhotos(group.id),
    getEventMembers(eventId),
  ]);

  const host = event.hostId ? await getMember(event.hostId) : null;
  const participantIds = new Set(members.map((m) => m.id));
  if (host && !participantIds.has(host.id)) members.unshift(host);

  const memberMap = new Map(members.map((m) => [m.id, m]));
  for (const id of [...new Set(posts.map((p) => p.memberId).concat(photos.map((p) => p.memberId)))]) {
    if (!memberMap.has(id)) {
      const m = await getMember(id);
      if (m) memberMap.set(id, m);
    }
  }

  return (
    <ConnectionShell viewer={viewer}>
      <div className='mx-auto max-w-2xl space-y-8'>
        <header className='space-y-3 border-b border-[#ebe9e4] pb-6'>
          <p className='text-[11px] font-medium tracking-[0.2em] text-[#6b6b6b]'>CONNECTION GROUP</p>
          <h1 className='text-xl font-semibold text-[#1a1a1a]'>{event.title}</h1>
          <p className='text-sm text-[#6b6b6b]'>{formatEventDate(event.startAt)} · {event.area}</p>
          <p className='text-xs leading-7 text-[#9a9a9a]'>
            参加者同士だけが見られる交流スペースです。写真はここでのみ共有され、トップページには掲載されません。
          </p>
        </header>

        <section>
          <SectionHeading title={`参加者 ${members.length}名`} />
          <div className='flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
            {members.map((member) => (
              <div key={member.id} className='flex shrink-0 flex-col items-center gap-1.5'>
                <MemberAvatar member={member} size={44} />
                <span className='max-w-[4.5rem] truncate text-[10px] text-[#6b6b6b]'>{member.nickname}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading title='写真ギャラリー' />
          <GroupPhotoGallery photos={photos} />
        </section>

        <Card className='border-[#dfe9e4] bg-[#faf9f6]'>
          <SectionHeading title='メッセージを投稿' />
          {viewerMemberId ? (
            <GroupComposer eventId={eventId} />
          ) : (
            <p className='text-sm text-[#6b6b6b]'>投稿するにはログインしてください。</p>
          )}
        </Card>

        <section>
          <SectionHeading title='タイムライン' />
          {viewerMemberId ? (
            <GroupFeedList
              eventId={eventId}
              posts={posts}
              photos={photos}
              memberMap={memberMap}
              viewerMemberId={viewerMemberId}
              isAdmin={access.isAdmin}
            />
          ) : null}
        </section>
      </div>
    </ConnectionShell>
  );
}
