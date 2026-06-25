import Link from 'next/link';
import { CoverImage } from '@/components/connection/landing/cover-image';
import { LandingSectionTitle } from '@/components/connection/landing/landing-ui';
import { EVENT_CATEGORY_META, EVENT_CATEGORY_ORDER } from '@/lib/connection/data';
import type { ConnectionEventCategory } from '@/lib/connection/types';

export function LandingCategoryCards() {
  return (
    <section className='space-y-5'>
      <LandingSectionTitle kicker='さまざまなテーマでつながる' title='Connectionの種類' />

      <div className='-mx-5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        {EVENT_CATEGORY_ORDER.map((cat) => (
          <CategoryCard key={cat} category={cat} />
        ))}
      </div>

      <div className='flex justify-center pt-2'>
        <Link
          href='/events'
          className='flex h-10 items-center justify-center rounded-full border border-[#1a1a1a]/80 px-5 text-xs font-semibold text-[#1a1a1a] transition active:scale-[0.98]'
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
      className='h-[228px] w-[128px] shrink-0 snap-start overflow-hidden rounded-xl border border-[#ebe5dc] bg-white shadow-[0_2px_10px_rgba(26,26,26,0.04)] transition active:scale-[0.98]'
    >
      <div className='relative h-[84px]'>
        <CoverImage
          src={meta.imagePath}
          alt={meta.short}
          fallbackClassName={`bg-gradient-to-br ${meta.gradient}`}
          imageClassName='object-cover'
        />
      </div>

      <div className='relative px-2.5 pb-3.5 pt-6 text-center'>
        <div
          className='absolute -top-4 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border bg-white text-sm shadow-sm'
          style={{ borderColor: '#c5a059' }}
          aria-hidden
        >
          {meta.emoji}
        </div>
        <p className='text-xs font-semibold text-[#1a1a1a]'>{meta.short}</p>
        <p className='mt-1 text-[9px] leading-[1.55] text-[#6b6b6b]'>{meta.landingTagline}</p>
      </div>
    </Link>
  );
}
