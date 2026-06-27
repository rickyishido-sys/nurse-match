import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { EventCard } from '@/components/connection/events/event-card';
import { EVENT_CATEGORY_META, EVENT_CATEGORY_ORDER } from '@/lib/connection/data';
import { listEvents } from '@/lib/connection/repo';
import type { ConnectionEventCategory } from '@/lib/connection/types';
import { getHanakaiViewer } from '@/lib/hanakai/session';

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
      <div className='space-y-6'>
        <div>
          <h1 className='text-xl font-semibold text-[#1a1a1a]'>Connection Event</h1>
          <p className='mt-2 text-sm leading-7 text-[#6b6b6b]'>
            テーマごとに、知らない誰かとリアルで出会う。気になる世界観を選んでください。
          </p>
        </div>

        {registered ? (
          <p className='rounded-2xl border border-[#ebe9e4] bg-white px-4 py-3 text-xs text-[#4a4a4a]'>
            プロフィール登録が完了しました。気になるイベントに参加申請しましょう。
          </p>
        ) : null}

        <Link
          href='/events/create'
          className='flex items-center justify-between gap-3 rounded-3xl border border-[#1f5d4f]/20 bg-gradient-to-br from-[#f3f7f5] to-[#eef3f0] px-5 py-4 transition active:scale-[0.99]'
        >
          <div>
            <p className='text-sm font-semibold text-[#1a1a1a]'>イベントを作成する</p>
            <p className='mt-0.5 text-xs leading-6 text-[#5b6f67]'>
              あなた自身が、心地よいConnectionをひらけます。
            </p>
          </div>
          <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1f5d4f] text-lg font-light text-white'>
            +
          </span>
        </Link>

        <div className='-mx-5 flex gap-2 overflow-x-auto px-5 pb-1'>
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
          <p className='rounded-2xl border border-[#ebe9e4] bg-white px-4 py-8 text-center text-sm text-[#9a9a9a]'>
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
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
        active ? 'bg-[#1a1a1a] text-white' : 'border border-[#d8d6d1] bg-white text-[#6b6b6b]'
      }`}
    >
      {label}
    </Link>
  );
}
