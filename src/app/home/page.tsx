import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { Card, SectionHeading } from '@/components/connection/ui';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import { EVENT_CATEGORY_LABEL, formatEventDate } from '@/lib/connection/data';
import { getMember, listUpcomingEvents } from '@/lib/connection/repo';
import { getViewerMemberId } from '@/lib/connection/identity';

export default async function HomePage() {
  const viewer = await getHanakaiViewer();
  const events = await listUpcomingEvents(4);
  const viewerMemberId = await getViewerMemberId();
  const member = viewerMemberId ? await getMember(viewerMemberId) : null;

  return (
    <ConnectionShell viewer={viewer}>
      <div className='space-y-8'>
        <section className='space-y-2'>
          <p className='text-[11px] font-medium tracking-[0.2em] text-[#6b6b6b]'>ようこそ</p>
          <h1 className='text-xl font-semibold text-[#1a1a1a]'>
            {member?.nickname ?? viewer?.displayName ?? 'ゲスト'}さん
          </h1>
          <p className='text-sm leading-7 text-[#6b6b6b]'>
            知らない人同士が、リアルで出会う。あなたの次のConnectionは、ここから始まります。
          </p>
        </section>

        <Card>
          <p className='text-xs font-medium text-[#6b6b6b]'>次のステップ</p>
          <p className='mt-2 text-sm font-semibold text-[#1a1a1a]'>Connection Eventに参加申請する</p>
          <p className='mt-1 text-xs leading-6 text-[#6b6b6b]'>運営が6名を選定し、リアルイベントが開催されます。</p>
          <Link href='/events' className='mt-4 inline-block text-xs font-semibold text-[#1a1a1a] underline-offset-2 hover:underline'>
            イベントを見る →
          </Link>
        </Card>

        <section>
          <SectionHeading title='開催予定のConnection Event' action={{ href: '/events', label: 'すべて' }} />
          <div className='space-y-3'>
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className='block rounded-2xl border border-[#ebe9e4] bg-white p-4'>
                <p className='text-[11px] font-medium text-[#6b6b6b]'>{EVENT_CATEGORY_LABEL[event.category]}</p>
                <p className='mt-1 text-sm font-semibold text-[#1a1a1a]'>{event.title}</p>
                <p className='mt-1 text-xs text-[#6b6b6b]'>{formatEventDate(event.startAt)}</p>
                <p className='text-xs text-[#9a9a9a]'>{event.reservedCount}/{event.capacity}名 申込</p>
              </Link>
            ))}
          </div>
        </section>

        <Card className='bg-[#f5f4f2]'>
          <p className='text-xs font-semibold text-[#1a1a1a]'>過去のConnection</p>
          <p className='mt-1 text-xs leading-6 text-[#6b6b6b]'>
            イベント参加者だけが閲覧できるConnectionページで、出会った人と繋がれます。
          </p>
          <Link href='/connections/ce6' className='mt-2 inline-block text-xs font-semibold text-[#1a1a1a] underline-offset-2 hover:underline'>
            横浜 Coffee Connection を見る →
          </Link>
        </Card>
      </div>
    </ConnectionShell>
  );
}
