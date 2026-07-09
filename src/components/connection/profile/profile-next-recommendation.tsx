'use client';

import Link from 'next/link';
import type { ProfileNextRecommendation } from '@/lib/connection/profile-completion';

export function ProfileNextRecommendationCard({ recommendation }: { recommendation: ProfileNextRecommendation }) {
  const isHashLink = recommendation.href.startsWith('#');

  return (
    <section className='rounded-3xl border border-[#ebe9e4] bg-white p-6 shadow-[0_4px_20px_rgba(26,26,26,0.04)]'>
      <p className='text-[11px] font-semibold tracking-[0.2em] text-[#b8956a]'>おすすめ</p>
      <h2 className='mt-1 text-lg font-semibold text-[#1a1a1a]'>次におすすめ</h2>
      <p className='mt-3 text-sm font-medium text-[#1f5d4f]'>{recommendation.title}</p>
      <p className='mt-2 text-sm leading-7 text-[#6b6b6b]'>{recommendation.body}</p>
      {isHashLink ? (
        <button
          type='button'
          onClick={() => {
            const id = recommendation.href.replace('#', '');
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className='mt-5 inline-flex h-11 w-full items-center justify-center rounded-full border border-[#1f5d4f] text-sm font-semibold text-[#1f5d4f] transition active:scale-[0.98]'
        >
          {recommendation.ctaLabel}
        </button>
      ) : (
        <Link
          href={recommendation.href}
          className='mt-5 inline-flex h-11 w-full items-center justify-center rounded-full border border-[#1f5d4f] text-sm font-semibold text-[#1f5d4f] transition active:scale-[0.98]'
        >
          {recommendation.ctaLabel}
        </Link>
      )}
    </section>
  );
}
