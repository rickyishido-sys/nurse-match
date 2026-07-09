import Link from 'next/link';
import { EventsEmptyState } from '@/components/connection/events/events-empty-state';
import { EventsListCard } from '@/components/connection/events/events-list-card';
import { EventsListHero } from '@/components/connection/events/events-list-hero';
import { BrandFloatCard } from '@/components/connection/brand/brand-motion';
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
          ほかのカテゴリーも見てみるか、新しいイベントの準備をお待ちください。
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
    <div className='grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3'>
      {items.map((item, i) => (
        <BrandFloatCard key={item.event.id} offset={i % 3 === 1 ? 12 : i % 3 === 2 ? 24 : 0}>
          <EventsListCard item={item} />
        </BrandFloatCard>
      ))}
    </div>
  );
}

export { EventsListHero };
