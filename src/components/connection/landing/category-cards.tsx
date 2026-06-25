import Link from 'next/link';
import { CoverImage } from '@/components/connection/landing/cover-image';
import { LandingSectionTitle } from '@/components/connection/landing/landing-ui';
import { EVENT_CATEGORY_META, EVENT_CATEGORY_ORDER } from '@/lib/connection/data';
import type { ConnectionEventCategory } from '@/lib/connection/types';

export function LandingCategoryCards() {
  return (
    <section className='space-y-6'>
      <LandingSectionTitle kicker='さまざまなテーマでつながる' title='Connectionの種類' />

      <div className='-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        {EVENT_CATEGORY_ORDER.map((cat) => (
          <CategoryCard key={cat} category={cat} />
        ))}
      </div>

      <div className='flex justify-center pt-1'>
        <Link
          href='/events'
          className='flex h-11 min-w-[240px] items-center justify-center rounded-full border border-[#1a1a1a] px-6 text-sm font-semibold text-[#1a1a1a] transition active:scale-[0.98]'
        >
          すべてのイベントを見る ›
        </Link>
      </div>
    </section>
  );
}

function CategoryCard({ category }: { category: ConnectionEventCategory }) {
  const meta = EVENT_CATEGORY_META[category];

  return (
    <Link
      href={`/events?category=${category}`}
      className='w-[148px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[#ebe5dc] bg-white shadow-[0_4px_16px_rgba(26,26,26,0.06)] transition active:scale-[0.98]'
    >
      <div className='relative h-[108px]'>
        <CoverImage
          src={meta.imagePath}
          alt={meta.short}
          fallbackClassName={`bg-gradient-to-br ${meta.gradient}`}
          imageClassName='object-cover'
        />
      </div>

      <div className='relative px-3 pb-4 pt-7 text-center'>
        <div
          className='absolute -top-5 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-2 bg-white text-lg shadow-sm'
          style={{ borderColor: '#c5a059' }}
          aria-hidden
        >
          {meta.emoji}
        </div>
        <p className='text-sm font-semibold text-[#1a1a1a]'>{meta.short}</p>
        <p className='mt-1.5 text-[10px] leading-[1.6] text-[#6b6b6b]'>{meta.landingTagline}</p>
      </div>
    </Link>
  );
}
