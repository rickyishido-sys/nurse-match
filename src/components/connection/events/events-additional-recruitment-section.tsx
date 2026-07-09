import { EventsListCard } from '@/components/connection/events/events-list-card';
import type { EnrichedEventListItem } from '@/lib/connection/events-list-data';

export function EventsAdditionalRecruitmentSection({ items }: { items: EnrichedEventListItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className='space-y-5'>
      <div className='text-center'>
        <div className='mx-auto max-w-md border-t border-[#e8dfd0]' aria-hidden />
        <p className='mt-4 text-sm font-semibold tracking-wide text-[#c0526b]'>🌸 追加募集しています</p>
        <div className='mx-auto mt-4 max-w-md border-t border-[#e8dfd0]' aria-hidden />
      </div>
      <p className='text-center text-xs leading-7 text-[#6b6b6b]'>
        参加確認の辞退などにより、追加で募集しているイベントです。
      </p>
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'>
        {items.map((item) => (
          <div key={item.event.id} className='rounded-3xl ring-2 ring-[#e8a0a8]/60 ring-offset-2 ring-offset-[#fafaf8]'>
            <EventsListCard item={item} variant='additional' />
          </div>
        ))}
      </div>
    </section>
  );
}
