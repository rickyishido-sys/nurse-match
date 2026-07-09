import Image from 'next/image';
import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { EventCard } from '@/components/connection/events/event-card';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import { getMember, listUpcomingEvents } from '@/lib/connection/repo';
import { getViewerMemberId } from '@/lib/connection/identity';

const GOLD = '#b8956a';

export default async function HomePage() {
  const viewer = await getHanakaiViewer();
  const events = await listUpcomingEvents(4);
  const viewerMemberId = await getViewerMemberId();
  const member = viewerMemberId ? await getMember(viewerMemberId) : null;
  const displayName = member?.nickname ?? viewer?.displayName ?? 'ゲスト';

  return (
    <ConnectionShell viewer={viewer}>
      <div className='space-y-12'>
        {/* ようこそ */}
        <section className='flex items-center justify-between gap-4'>
          <div className='min-w-0 space-y-2'>
            <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
              WELCOME
            </p>
            <h1 className='truncate text-[1.6rem] font-semibold leading-tight tracking-tight text-[#1a1a1a]'>
              {displayName}さん
            </h1>
            <p className='text-sm leading-7 text-[#6b6b6b]'>
              知らない人同士が、リアルで出会う。
              <br className='hidden sm:block' />
              あなたの次の出会いは、ここから始まります。
            </p>
          </div>
          <div
            className='relative hidden h-24 w-24 shrink-0 items-center justify-center rounded-[28px] sm:flex'
            style={{ background: 'radial-gradient(circle at 50% 36%, #f8eef0 0%, #f0e2e4 74%)' }}
          >
            <div className='relative h-16 w-16'>
              <Image src='/categories/flower.png' alt='' fill sizes='64px' className='object-contain' />
            </div>
          </div>
        </section>

        {/* 次のステップ */}
        <Link
          href='/events'
          className='flex items-center justify-between gap-4 rounded-3xl border border-[#1f5d4f]/15 bg-gradient-to-br from-[#f3f7f5] to-[#eef3f0] px-6 py-6 transition active:scale-[0.99]'
        >
          <div className='min-w-0'>
            <p className='text-[11px] font-semibold tracking-[0.18em]' style={{ color: GOLD }}>
              NEXT STEP
            </p>
            <p className='mt-2 text-base font-semibold text-[#1a1a1a]'>イベントに参加申請する</p>
            <p className='mt-1.5 text-xs leading-6 text-[#5b6f67]'>
              運営が参加メンバーを選定し、リアルイベントが開催されます。
            </p>
            <span className='mt-3 inline-block text-xs font-semibold text-[#1f5d4f]'>イベントを見る →</span>
          </div>
          <div
            className='relative hidden h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-white/70 sm:flex'
          >
            <div className='relative h-14 w-14'>
              <Image src='/flow/matching.png' alt='' fill sizes='56px' className='object-contain' />
            </div>
          </div>
        </Link>

        {/* 開催予定 */}
        <section className='space-y-5'>
          <div className='flex items-end justify-between'>
            <div className='space-y-1.5'>
              <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
                UPCOMING
              </p>
              <h2 className='text-lg font-semibold tracking-tight text-[#1a1a1a]'>開催予定のイベント</h2>
            </div>
            <Link href='/events' className='text-xs font-medium text-[#8b7355] underline-offset-2 hover:underline'>
              すべて
            </Link>
          </div>
          {events.length > 0 ? (
            <div className='space-y-5 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0'>
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className='rounded-2xl border border-[#ebe9e4] bg-white px-4 py-8 text-center text-sm text-[#9a9a9a]'>
              開催予定のイベントはまだありません。
            </p>
          )}
        </section>

        {/* 過去のConnection */}
        <section
          className='flex items-center justify-between gap-4 rounded-3xl border border-[#ebe5dc] px-6 py-6'
          style={{ background: 'linear-gradient(135deg, #f6f0e6 0%, #f1ece2 100%)' }}
        >
          <div className='min-w-0'>
            <p className='text-[11px] font-semibold tracking-[0.18em]' style={{ color: GOLD }}>
              CONNECTIONS
            </p>
            <p className='mt-2 text-sm font-semibold text-[#1a1a1a]'>過去のConnection</p>
            <p className='mt-1.5 text-xs leading-6 text-[#7a7264]'>
              イベント参加者だけが見られるページで、出会った人とつながれます。
            </p>
            <Link
              href='/connections'
              className='mt-3 inline-block text-xs font-semibold text-[#8b7355] underline-offset-2 hover:underline'
            >
              自分のConnectionを見る →
            </Link>
          </div>
          <div className='relative hidden h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-white/60 sm:flex'>
            <div className='relative h-14 w-14'>
              <Image src='/flow/continue.png' alt='' fill sizes='56px' className='object-contain' />
            </div>
          </div>
        </section>
      </div>
    </ConnectionShell>
  );
}
