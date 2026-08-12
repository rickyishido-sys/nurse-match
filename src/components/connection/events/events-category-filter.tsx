import Link from 'next/link';
import { EVENTS_LIST_FILTERS, type EventsListFilterSlug } from '@/lib/connection/events-list-ux';

export function EventsCategoryFilter({
  active,
  region,
}: {
  active: EventsListFilterSlug;
  /** Preserve region query when switching categories */
  region?: string | null;
}) {
  return (
    <div className='space-y-3'>
      <p className='text-xs font-medium tracking-wide text-[#9a9a9a]'>カテゴリーから探す</p>
      <div className='-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        {EVENTS_LIST_FILTERS.map((filter) => {
          const params = new URLSearchParams();
          if (filter.slug) params.set('category', filter.slug);
          if (region) params.set('region', region);
          const q = params.toString();
          const href = q ? `/events?${q}` : '/events';
          const isActive = active === filter.slug;
          return (
            <Link
              key={filter.slug || 'all'}
              href={href}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-medium transition active:scale-[0.97] ${
                isActive
                  ? 'bg-[#1f5d4f] text-white shadow-[0_4px_14px_rgba(31,93,79,0.22)]'
                  : 'border border-[#e3ddd2] bg-white text-[#4a4a4a] hover:border-[#cfe3da]'
              }`}
            >
              <span aria-hidden>{filter.emoji}</span>
              {filter.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
