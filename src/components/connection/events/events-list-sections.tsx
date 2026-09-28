import Link from 'next/link';
import { EventsEmptyState } from '@/components/connection/events/events-empty-state';
import { EventsListCard } from '@/components/connection/events/events-list-card';
import { EventsListHero } from '@/components/connection/events/events-list-hero';
import { CreateEventCta } from '@/components/connection/events/create-event-cta';
import { BrandFloatCard } from '@/components/connection/brand/brand-motion';
import { ctaSecondary } from '@/components/connection/ui/cta-classes';
import { HK } from '@/lib/connection/brand/tokens';
import type { EnrichedEventListItem } from '@/lib/connection/events-list-data';
import type { EventsListFilterSlug } from '@/lib/connection/events-list-ux';

type Props = {
  items: EnrichedEventListItem[];
  activeFilter: EventsListFilterSlug;
  totalCount: number;
  canCreateEvent?: boolean;
};

export function EventsListGrid({ items, activeFilter, totalCount, canCreateEvent = false }: Props) {
  if (totalCount === 0) {
    return <EventsEmptyState canCreateEvent={canCreateEvent} />;
  }

  if (items.length === 0) {
    return (
      <div className='rounded-3xl border border-[#ebe9e4] bg-gradient-to-br from-[#fbf8f3] to-[#f6f3ec] px-6 py-14 text-center'>
        <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl shadow-sm' aria-hidden>
          ✿
        </div>
        <p className='mt-5 text-sm font-semibold text-[#1a1a1a]'>
          {canCreateEvent ? 'やってみたいこと、ありませんか？' : 'このカテゴリーでは、まだイベントがありません'}
        </p>
        <p className='mx-auto mt-2 max-w-sm text-xs leading-7 text-[#6b6b6b]'>
          {canCreateEvent
            ? '参加したいイベントがまだ見つからなければ、あなたの好きなことからイベントを作ることもできます。'
            : 'あなたが最初のイベントを作ってみませんか？ほかのカテゴリーを見ることもできます。'}
        </p>
        <div className='mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          <CreateEventCta
            source='events_category_empty'
            className='inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white'
            style={{ background: HK.coral }}
          >
            イベントを作る
          </CreateEventCta>
          <Link href='/events' className={ctaSecondary}>
            すべてのイベントを見る
          </Link>
        </div>
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
