import Image from 'next/image';
import Link from 'next/link';
import { EventsEmptyState } from '@/components/connection/events/events-empty-state';
import { EventsListCard } from '@/components/connection/events/events-list-card';
import type { EnrichedEventListItem } from '@/lib/connection/events-list-data';
import type { EventsListFilterSlug } from '@/lib/connection/events-list-ux';

type Props = {
  items: EnrichedEventListItem[];
  activeFilter: EventsListFilterSlug;
  totalCount: number;
};

export function EventsListGrid({ items, activeFilter, totalCount }: Props) {
  if (totalCount === 0) {
    return <EventsEmptyState />;
  }

  if (items.length === 0) {
    return (
      <div className='rounded-3xl border border-[#ebe9e4] bg-gradient-to-br from-[#fbf8f3] to-[#f6f3ec] px-6 py-14 text-center'>
        <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl shadow-sm' aria-hidden>
          ✿
        </div>
        <p className='mt-5 text-sm font-semibold text-[#1a1a1a]'>
          このカテゴリーでは、まだイベントがありません
        </p>
        <p className='mx-auto mt-2 max-w-sm text-xs leading-7 text-[#6b6b6b]'>
          ほかのカテゴリーも見てみるか、新しいConnectionの準備をお待ちください。
        </p>
        <Link
          href='/events'
          className='mt-6 inline-flex h-11 items-center justify-center rounded-full border border-[#1f5d4f] px-6 text-sm font-semibold text-[#1f5d4f]'
        >
          すべてのイベントを見る
        </Link>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'>
      {items.map((item) => (
        <EventsListCard key={item.event.id} item={item} />
      ))}
    </div>
  );
}

export function EventsListHero() {
  return (
    <div className='relative overflow-hidden rounded-3xl border border-[#e8dfd0] bg-gradient-to-br from-[#fbf8f3] via-[#f6f3ec] to-[#eef3ef] px-6 py-8 sm:px-8'>
      <div
        className='pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#f3e8dc] opacity-50'
        aria-hidden
      />
      <div className='relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between'>
        <div className='max-w-xl space-y-3'>
          <p className='text-[11px] font-semibold tracking-[0.2em] text-[#b8956a]'>CONNECTION</p>
          <h1 className='text-[1.65rem] font-semibold leading-tight tracking-tight text-[#1a1a1a] sm:text-[1.85rem]'>
            体験からはじまる、新しいつながり
          </h1>
          <p className='text-sm leading-8 text-[#5a5a5a]'>
            花・コーヒー・散歩——興味のある体験を選んで、知らない人とのConnectionに参加してみませんか。
            理解から始まる、HANAKAIらしい出会いがここにあります。
          </p>
        </div>
        <div className='relative mx-auto h-28 w-28 shrink-0 sm:mx-0'>
          <Image src='/categories/flower.png' alt='' fill sizes='112px' className='object-contain' />
        </div>
      </div>
    </div>
  );
}
