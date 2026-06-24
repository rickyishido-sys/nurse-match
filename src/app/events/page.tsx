import Image from 'next/image';
import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import {
  EVENT_CATEGORY_META,
  EVENT_CATEGORY_ORDER,
  formatEventDate,
  listEvents,
} from '@/lib/connection/data';
import type { ConnectionEventCategory } from '@/lib/connection/types';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function statusLabel(status: string) {
  if (status === 'full') return '満席';
  if (status === 'almost_full') return '残りわずか';
  if (status === 'completed') return '終了';
  return '受付中';
}

export default async function EventsPage({ searchParams }: PageProps) {
  const viewer = await getHanakaiViewer();
  const sp = searchParams ? await searchParams : {};
  const activeCategory = (typeof sp.category === 'string' ? sp.category : '') as ConnectionEventCategory | '';
  const registered = sp.registered === '1';

  const allEvents = listEvents().filter((e) => !e.isPast);
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

        <div className='space-y-5'>
          {events.map((event) => {
            const meta = EVENT_CATEGORY_META[event.category];
            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className='block overflow-hidden rounded-3xl border border-[#ebe9e4] bg-white shadow-[0_2px_12px_rgba(26,26,26,0.04)] transition active:scale-[0.99]'
              >
                <div className={`relative h-44 w-full bg-gradient-to-br ${meta.gradient}`}>
                  <Image src={event.coverUrl} alt={event.title} fill className='object-cover mix-blend-multiply' />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent' />
                  <div className='absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#1a1a1a] backdrop-blur'>
                    <span>{meta.emoji}</span>
                    {meta.short}
                  </div>
                  <div className='absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur'>
                    {statusLabel(event.status)}
                  </div>
                  <div className='absolute bottom-3 left-3 right-3'>
                    <p className='text-sm font-semibold text-white drop-shadow'>{event.title}</p>
                    <p className='mt-0.5 text-[11px] text-white/85'>{meta.tagline}</p>
                  </div>
                </div>
                <div className='space-y-1.5 p-4'>
                  <p className='text-xs text-[#6b6b6b]'>{formatEventDate(event.startAt)}</p>
                  <p className='text-xs text-[#6b6b6b]'>{event.area} · {event.venue}</p>
                  <div className='flex items-center justify-between pt-1'>
                    <span className='text-xs text-[#9a9a9a]'>{event.reservedCount}/{event.capacity}名 申込</span>
                    <span className='text-xs font-semibold' style={{ color: meta.accent }}>詳細を見る →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
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
