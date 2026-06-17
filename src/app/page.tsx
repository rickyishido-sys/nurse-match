import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { SecondaryButton } from '@/components/connection/ui';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import { listUpcomingEvents } from '@/lib/connection/data';
import { EVENT_CATEGORY_LABEL, formatEventDate } from '@/lib/connection/data';

export default async function LandingPage() {
  const viewer = await getHanakaiViewer();
  const events = listUpcomingEvents(3);

  return (
    <ConnectionShell viewer={viewer} showNav={false}>
      <section className='space-y-10 pt-4'>
        {/* Hero */}
        <div className='space-y-6'>
          <div className='space-y-2'>
            <p className='text-[11px] font-medium tracking-[0.28em] text-[#6b6b6b]'>HANAKAI CONNECTION</p>
            <h1 className='text-[2rem] font-semibold leading-[1.2] tracking-tight text-[#1a1a1a]'>
              人と人との
              <br />
              新しいConnectionを
              <br />
              生み出す
            </h1>
            <p className='text-sm font-medium text-[#6b6b6b]'>リアル体験プラットフォーム</p>
          </div>

          <div className='space-y-3 text-sm leading-7 text-[#4a4a4a]'>
            <p>SNSでは作れない出会い。</p>
            <p>マッチングアプリではない出会い。</p>
            <p>偶然と共感から始まるConnection。</p>
          </div>

          <div className='grid gap-3 pt-2'>
            <Link href='/register' className='flex h-12 items-center justify-center rounded-full bg-[#1a1a1a] text-sm font-semibold text-white'>
              参加登録
            </Link>
            <SecondaryButton href='/events'>イベントを見る</SecondaryButton>
          </div>
        </div>

        {/* How it works */}
        <div className='space-y-4 border-t border-[#ebe9e4] pt-8'>
          <h2 className='text-sm font-semibold tracking-wide text-[#1a1a1a]'>体験の流れ</h2>
          <ol className='space-y-4'>
            {[
              { step: '01', title: '参加登録', body: 'プロフィールと、あなたが求めるConnectionを登録。' },
              { step: '02', title: 'イベントに申請', body: '気になるConnection Eventに参加希望を送る。' },
              { step: '03', title: '6人が選ばれる', body: '運営が6名を選定。知らない人同士がリアルで会う。' },
              { step: '04', title: 'イベント後に繋がる', body: '参加者だけが閲覧できるConnectionページで、次につながる。' },
            ].map((item) => (
              <li key={item.step} className='flex gap-4'>
                <span className='text-xs font-semibold text-[#9a9a9a]'>{item.step}</span>
                <div>
                  <p className='text-sm font-semibold text-[#1a1a1a]'>{item.title}</p>
                  <p className='mt-1 text-xs leading-6 text-[#6b6b6b]'>{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Upcoming events */}
        <div className='space-y-4 border-t border-[#ebe9e4] pt-8'>
          <div className='flex items-end justify-between'>
            <h2 className='text-sm font-semibold tracking-wide text-[#1a1a1a]'>開催予定のイベント</h2>
            <Link href='/events' className='text-xs text-[#6b6b6b] underline-offset-2 hover:underline'>すべて</Link>
          </div>
          <div className='space-y-3'>
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} className='block rounded-2xl border border-[#ebe9e4] bg-white p-4'>
                <p className='text-[11px] font-medium text-[#6b6b6b]'>{EVENT_CATEGORY_LABEL[event.category]}</p>
                <p className='mt-1 text-sm font-semibold text-[#1a1a1a]'>{event.title}</p>
                <p className='mt-1 text-xs text-[#6b6b6b]'>{formatEventDate(event.startAt)} · {event.area}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </ConnectionShell>
  );
}
