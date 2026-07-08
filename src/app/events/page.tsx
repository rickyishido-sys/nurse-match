import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { EventCard } from '@/components/connection/events/event-card';
import { EVENT_CATEGORY_META, EVENT_CATEGORY_ORDER } from '@/lib/connection/data';
import { listEvents } from '@/lib/connection/repo';
import type { ConnectionEventCategory } from '@/lib/connection/types';
import { getHanakaiViewer } from '@/lib/hanakai/session';

const GOLD = '#b8956a';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function EventsPage({ searchParams }: PageProps) {
  const viewer = await getHanakaiViewer();
  const sp = searchParams ? await searchParams : {};
  const activeCategory = (typeof sp.category === 'string' ? sp.category : '') as ConnectionEventCategory | '';
  const registered = sp.registered === '1';

  const allEvents = (await listEvents()).filter((e) => !e.isPast);
  const events = activeCategory ? allEvents.filter((e) => e.category === activeCategory) : allEvents;

  return (
    <ConnectionShell viewer={viewer}>
      <div className='space-y-7'>
        <div className='space-y-2'>
          <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
            CONNECTION EVENT
          </p>
          <h1 className='text-[1.6rem] font-semibold leading-tight tracking-tight text-[#1a1a1a]'>
            参加したいConnectionを見つける
          </h1>
          <p className='text-sm leading-7 text-[#6b6b6b]'>
            花・コーヒー・食事・散歩など、興味のある体験から新しいConnectionを見つけてください。
          </p>
        </div>

        {registered ? (
          <p className='rounded-2xl border border-[#1f5d4f]/15 bg-[#f3f7f5] px-4 py-3 text-xs leading-6 text-[#3f5a51]'>
            プロフィール登録が完了しました。気になるイベントに参加申請しましょう。
          </p>
        ) : null}

        <Link
          href='/events/create'
          className='flex items-center justify-between gap-3 rounded-3xl border border-[#1f5d4f]/15 bg-gradient-to-br from-[#f3f7f5] to-[#eef3f0] px-6 py-5 transition active:scale-[0.99]'
        >
          <div>
            <p className='text-[11px] font-semibold tracking-[0.18em]' style={{ color: GOLD }}>
              HOST
            </p>
            <p className='mt-1.5 text-sm font-semibold text-[#1a1a1a]'>イベントを作成する</p>
            <p className='mt-0.5 text-xs leading-6 text-[#5b6f67]'>
              あなた自身が、心地よいConnectionをひらけます。
            </p>
          </div>
          <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1f5d4f] text-xl font-light text-white'>
            +
          </span>
        </Link>

        <div className='-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
          <CategoryPill href='/events' label='すべて' active={!activeCategory} />
          {EVENT_CATEGORY_ORDER.map((cat) => (
            <CategoryPill
              key={cat}
              href={`/events?category=${cat}`}
              label={`${EVENT_CATEGORY_META[cat].emoji} ${EVENT_CATEGORY_META[cat].short}`}
              active={activeCategory === cat}
            />
          ))}
        </div>

        {events.length > 0 ? (
          <div className='space-y-5 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0'>
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className='rounded-2xl border border-[#ebe9e4] bg-white px-4 py-10 text-center text-sm text-[#9a9a9a]'>
            このカテゴリーのイベントはまだありません。
          </p>
        )}
      </div>
    </ConnectionShell>
  );
}

function CategoryPill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition active:scale-[0.97] ${
        active
          ? 'bg-[#1a1a1a] text-white shadow-[0_2px_8px_rgba(26,26,26,0.18)]'
          : 'border border-[#e3ddd2] bg-white text-[#6b6b6b]'
      }`}
    >
      {label}
    </Link>
  );
}
