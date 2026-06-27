import Image from 'next/image';
import Link from 'next/link';
import { LandingSectionTitle } from '@/components/connection/landing/landing-ui';
import { EVENT_CATEGORY_META } from '@/lib/connection/data';
import type { ConnectionEventCategory } from '@/lib/connection/types';

/** ランディングで紹介するカテゴリーと、対応するイラスト。 */
const CATEGORY_CARDS: { category: ConnectionEventCategory; img: string }[] = [
  { category: 'flower', img: '/categories/flower.png' },
  { category: 'coffee', img: '/categories/cafe.png' },
  { category: 'bar', img: '/categories/bar.png' },
  { category: 'fitness', img: '/categories/fitness.png' },
  { category: 'walking', img: '/categories/stroll.png' },
];

export function LandingCategoryCards() {
  return (
    <section className='space-y-5 lg:space-y-6'>
      <LandingSectionTitle kicker='さまざまなテーマでつながる' title='Connectionの種類' />

      <div className='-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:gap-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0 lg:snap-none [&::-webkit-scrollbar]:hidden'>
        {CATEGORY_CARDS.map(({ category, img }) => (
          <CategoryCard key={category} category={category} img={img} />
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

function CategoryCard({ category, img }: { category: ConnectionEventCategory; img: string }) {
  const meta = EVENT_CATEGORY_META[category];

  return (
    <Link
      href={`/events?category=${category}`}
      className='flex w-[150px] shrink-0 snap-start flex-col items-center rounded-2xl border border-[#ebe5dc] bg-white px-4 py-7 text-center shadow-[0_2px_12px_rgba(26,26,26,0.04)] transition active:scale-[0.98] md:w-[160px] lg:w-full lg:shrink lg:px-5 lg:py-8'
    >
      <div className='relative h-24 w-24 lg:h-28 lg:w-28'>
        <Image
          src={img}
          alt={meta.short}
          fill
          sizes='(min-width: 1024px) 112px, 96px'
          className='object-contain'
        />
      </div>

      <p className='mt-5 text-sm font-semibold text-[#1a1a1a] lg:text-base'>{meta.short}</p>
      <p className='mt-1.5 text-[11px] leading-[1.6] text-[#6b6b6b] lg:text-xs'>{meta.landingTagline}</p>
    </Link>
  );
}
