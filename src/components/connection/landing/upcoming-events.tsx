import Image from 'next/image';
import Link from 'next/link';
import { EVENT_CATEGORY_META, formatEventDate } from '@/lib/connection/data';
import type { ConnectionEvent } from '@/lib/connection/types';

type LandingEventsProps = {
  events: ConnectionEvent[];
};

export function LandingUpcomingEvents({ events }: LandingEventsProps) {
  if (events.length === 0) return null;

  return (
    <section className='space-y-5'>
      <div className='flex items-end justify-between'>
        <div>
          <p className='text-[11px] font-medium tracking-[0.24em] text-[#9a8b78]'>UPCOMING</p>
          <h2 className='text-lg font-semibold text-[#1a1a1a]'>開催予定のイベント</h2>
        </div>
        <Link href='/events' className='text-xs font-medium text-[#8b7355] underline-offset-2 hover:underline'>
          すべて
        </Link>
      </div>

      <div className='space-y-4'>
        {events.map((event) => {
          const meta = EVENT_CATEGORY_META[event.category];
          return (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className='block overflow-hidden rounded-3xl border border-[#ebe5dc] bg-white shadow-[0_4px_16px_rgba(26,26,26,0.05)] transition active:scale-[0.99]'
            >
              <div className={`relative h-36 w-full bg-gradient-to-br ${meta.gradient}`}>
                <Image src={event.coverUrl} alt={event.title} fill className='object-cover mix-blend-multiply' sizes='420px' />
                <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent' />
                <div className='absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#1a1a1a] backdrop-blur'>
                  <span>{meta.emoji}</span>
                  {meta.short}
                </div>
                <p className='absolute bottom-3 left-3 right-3 text-sm font-semibold text-white drop-shadow'>{event.title}</p>
              </div>
              <div className='px-4 py-3'>
                <p className='text-xs text-[#6b6b6b]'>{formatEventDate(event.startAt)} · {event.area}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
