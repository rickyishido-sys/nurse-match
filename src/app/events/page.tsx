import Image from 'next/image';
import Link from 'next/link';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Chip } from '@/components/hanakai/ui';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import { formatEventDate, formatYen, getUserName, listEvents } from '@/lib/hanakai/data';

function statusChip(status: string) {
  if (status === 'full') return <Chip tone='gray'>満席</Chip>;
  if (status === 'almost_full') return <Chip tone='pink'>残りわずか</Chip>;
  if (status === 'closed') return <Chip tone='gray'>受付終了</Chip>;
  return <Chip tone='green'>受付中</Chip>;
}

export default async function EventsPage() {
  const viewer = await getHanakaiViewer();
  const events = listEvents();

  return (
    <HanakaiShell viewer={viewer}>
      <div className='space-y-4'>
        <h1 className='text-lg font-bold text-slate-800'>花会をさがす</h1>
        <div className='space-y-3'>
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`} className='block overflow-hidden rounded-3xl border border-[#eaeee6] bg-white'>
              <div className='relative h-36 w-full'>
                <Image src={event.coverUrl} alt={event.title} fill className='object-cover' />
                <div className='absolute right-2 top-2'>{statusChip(event.status)}</div>
              </div>
              <div className='space-y-1 p-3'>
                <p className='text-sm font-semibold text-slate-800'>{event.title}</p>
                <p className='text-xs text-slate-500'>{formatEventDate(event.startAt)}</p>
                <p className='text-xs text-slate-500'>{event.area}・{event.venue}</p>
                <div className='flex items-center gap-2 pt-1 text-xs text-slate-600'>
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
        </div>
      </div>
    </HanakaiShell>
  );
}
