'use client';

import type { ReactNode } from 'react';
import { Heading, HK, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';
import { SnapCarousel } from '@/components/connection/landing/v2/carousel';

function Line({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox='0 0 48 48'
      className='h-14 w-14'
      fill='none'
      stroke={HK.gold}
      strokeWidth={1.4}
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      {children}
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  review: (
    <Line>
      <path d='M24 5l15 6v9c0 10-6.4 16.8-15 19-8.6-2.2-15-9-15-19v-9l15-6z' />
      <path d='M17 23l5 5 9-10' />
    </Line>
  ),
  identity: (
    <Line>
      <rect x='7' y='11' width='34' height='26' rx='3' />
      <circle cx='18' cy='23' r='4' />
      <path d='M12 32c1-3.2 4-5 6-5s5 1.8 6 5' />
      <path d='M29 19h7M29 25h7M29 31h4' />
    </Line>
  ),
  report: (
    <Line>
      <path d='M11 6v36' />
      <path d='M11 8h22l-3 6 3 6H11' />
    </Line>
  ),
  block: (
    <Line>
      <circle cx='24' cy='24' r='15' />
      <path d='M13.5 13.5l21 21' />
    </Line>
  ),
  guideline: (
    <Line>
      <path d='M13 6h16l6 6v30H13z' />
      <path d='M29 6v6h6' />
      <path d='M18 24h12M18 30h12M18 18h6' />
    </Line>
  ),
  noSales: (
    <Line>
      <circle cx='24' cy='24' r='15' />
      <path d='M13.5 13.5l21 21' />
      <path d='M20 28c0-6 8-6 8-11 0-2.2-1.8-4-4-4' />
    </Line>
  ),
  rating: (
    <Line>
      <path d='M24 7l5.2 10.5L41 19l-8.5 8.3L34.5 39 24 33.4 13.5 39l2-11.7L7 19l11.8-1.5z' />
    </Line>
  ),
};

const ITEMS = [
  { icon: 'review', title: '運営による参加審査', body: 'すべての参加者を運営が確認し、安心できる場を保ちます。' },
  { icon: 'identity', title: '本人確認制度', body: '本人確認を通じて、なりすましや不審な参加を防ぎます。' },
  { icon: 'report', title: '通報機能', body: '気になる言動はいつでも運営へ通報できます。' },
  { icon: 'block', title: 'ブロック機能', body: '苦手な相手とは、つながらない自由があります。' },
  { icon: 'guideline', title: 'コミュニティガイドライン', body: '心地よい交流のための共通のルールを定めています。' },
  { icon: 'noSales', title: '勧誘・営業行為の禁止', body: '勧誘やビジネス目的の参加は固く禁止しています。' },
  { icon: 'rating', title: 'イベント評価システム', body: '参加後の評価で、安心の循環を育てていきます。' },
];

export function LandingSafety() {
  return (
    <Section tone='white'>
      <div className='flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>Point 04</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>安心して参加できる仕組み</Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead className='mt-6 max-w-[40ch]'>
            はじめての方も、一人での参加も。安心して花会に集えるよう、いくつもの仕組みを用意しています。
          </Lead>
        </Reveal>
      </div>

      <Reveal delay={0.15} className='mx-auto mt-12 max-w-[620px]'>
        <SnapCarousel
          ariaLabel='安心して参加できる仕組み'
          items={ITEMS.map((item) => (
            <div
              key={item.title}
              className='flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-[#ece3d4] bg-[#faf7f2] px-8 py-12 text-center'
            >
              <div className='flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_6px_20px_rgba(184,149,106,0.18)]'>
                {ICONS[item.icon]}
              </div>
              <p className='mt-7 text-lg font-semibold text-[#1a1a1a]'>{item.title}</p>
              <p className='mt-3 max-w-[26ch] text-sm leading-[1.9] text-[#6b6b6b]'>{item.body}</p>
            </div>
          ))}
        />
      </Reveal>
    </Section>
  );
}
