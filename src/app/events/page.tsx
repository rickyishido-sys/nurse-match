import Image from 'next/image';
import Link from 'next/link';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Chip } from '@/components/hanakai/ui';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import {
  EVENT_CATEGORY_LABEL,
  EVENT_CATEGORY_ORDER,
  formatEventDate,
  formatYen,
  getUserName,
  listEvents,
} from '@/lib/hanakai/data';
import type { EventCategory } from '@/lib/hanakai/types';

function statusChip(status: string) {
  if (status === 'full') return <Chip tone='gray'>満席</Chip>;
  if (status === 'almost_full') return <Chip tone='pink'>残りわずか</Chip>;
  if (status === 'closed') return <Chip tone='gray'>受付終了</Chip>;
  return <Chip tone='green'>受付中</Chip>;
}

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function EventsPage({ searchParams }: PageProps) {
  const viewer = await getHanakaiViewer();
  const sp = searchParams ? await searchParams : {};
  const activeCategory = (typeof sp.category === 'string' ? sp.category : '') as EventCategory | '';

  const allEvents = listEvents();
  const events = activeCategory ? allEvents.filter((e) => e.category === activeCategory) : allEvents;

  return (
    <HanakaiShell viewer={viewer}>
      <div className='space-y-4'>
        <div>
          <h1 className='text-lg font-bold text-slate-800'>リアル花会をさがす</h1>
          <p className='text-xs leading-6 text-slate-500'>花をいけ、語らい、また会いたい人と出会う。すべてはリアルの体験から。</p>
        </div>

        {/* カテゴリフィルタ */}
        <div className='-mx-4 flex gap-2 overflow-x-auto px-4 pb-1'>
          <CategoryPill href='/events' label='すべて' active={!activeCategory} />
          {EVENT_CATEGORY_ORDER.map((cat) => (
            <CategoryPill
              key={cat}
              href={`/events?category=${cat}`}
              label={EVENT_CATEGORY_LABEL[cat]}
              active={activeCategory === cat}
            />
          ))}
        </div>

        <div className='space-y-3'>
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`} className='block overflow-hidden rounded-3xl border border-[#eaeee6] bg-white'>
              <div className='relative h-36 w-full'>
                <Image src={event.coverUrl} alt={event.title} fill className='object-cover' />
                <div className='absolute left-2 top-2'><Chip tone='gold'>{EVENT_CATEGORY_LABEL[event.category]}</Chip></div>
                <div className='absolute right-2 top-2'>{statusChip(event.status)}</div>
              </div>
              <div className='space-y-1 p-3'>
                <p className='text-sm font-semibold text-slate-800'>{event.title}</p>
                <p className='text-xs text-slate-500'>{formatEventDate(event.startAt)}</p>
                <p className='text-xs text-slate-500'>{event.area}・{event.venue}</p>
                <div className='flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600'>
                  <span>{getUserName(event.hostId)}先生</span>
                  <span>・</span>
                  <span>{formatYen(event.fee)}</span>
                  <span>・</span>
                  <span>{event.reservedCount}/{event.capacity}名</span>
                  {event.hasAlcohol ? <Chip tone='gold'>お酒あり</Chip> : null}
                </div>
              </div>
            </Link>
          ))}
          {events.length === 0 ? (
            <p className='rounded-2xl bg-[#f5f8f3] px-3 py-6 text-center text-xs text-slate-500'>このカテゴリの花会は準備中です。</p>
          ) : null}
        </div>
      </div>
    </HanakaiShell>
  );
}

function CategoryPill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
        active ? 'bg-[#4f7a4a] text-white' : 'border border-[#e0e7db] bg-white text-slate-600'
      }`}
    >
      {label}
    </Link>
  );
}
