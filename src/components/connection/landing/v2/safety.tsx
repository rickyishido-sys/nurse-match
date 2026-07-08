'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Heading, HK, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';

function Line({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox='0 0 48 48'
      className='h-12 w-12'
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
  admin: (
    <Line>
      <circle cx='24' cy='14' r='5' />
      <path d='M10 40c2-8 8-12 14-12s12 4 14 12' />
      <path d='M32 22l4 4-4 4' />
    </Line>
  ),
  guideline: (
    <Line>
      <path d='M13 6h16l6 6v30H13z' />
      <path d='M29 6v6h6' />
      <path d='M18 24h12M18 30h12M18 18h6' />
    </Line>
  ),
  block: (
    <Line>
      <circle cx='24' cy='24' r='15' />
      <path d='M13.5 13.5l21 21' />
    </Line>
  ),
};

const ITEMS = [
  { icon: 'review', title: '参加審査', body: '運営が参加申請を確認し、心地よい場を保ちます。' },
  { icon: 'identity', title: '本人確認', body: '本人確認バッジで、なりすましへの不安を減らします。' },
  { icon: 'report', title: '通報機能', body: '気になる言動は、アプリからいつでも運営へ通報できます。' },
  { icon: 'admin', title: '運営管理体制', body: '通報・問い合わせに運営が対応し、必要に応じて利用制限を行います。' },
  { icon: 'guideline', title: 'コミュニティガイドライン', body: '尊重と安心のための共通ルールを定めています。' },
  { icon: 'block', title: 'ブロック機能', body: 'つながりたくない相手とは、自分で距離を取れます。' },
] as const;

export function LandingSafety() {
  return (
    <Section tone='cream'>
      <div className='flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>Safety</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>安心して参加できる仕組み</Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead className='mt-6 max-w-[42ch]'>
            はじめての方も、一人参加も大歓迎。
            本人確認・通報・運営対応で、安心して体験に集中できます。
          </Lead>
        </Reveal>
      </div>

      <Reveal delay={0.12}>
        <div className='mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5'>
          {ITEMS.map((item) => (
            <div
              key={item.title}
              className='flex flex-col rounded-[1.75rem] border border-[#e8dfd0] bg-white px-6 py-7 shadow-[0_6px_24px_rgba(26,26,26,0.04)]'
            >
              <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3f7f5]'>
                {ICONS[item.icon]}
              </div>
              <p className='mt-5 text-base font-semibold text-[#1a1a1a]'>{item.title}</p>
              <p className='mt-2 text-sm leading-[1.85] text-[#6b6b6b]'>{item.body}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.18}>
        <div className='mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-[#6b6b6b]'>
          <Link href='/community-guidelines' className='font-semibold text-[#1f5d4f] underline-offset-2 hover:underline'>
            コミュニティガイドライン
          </Link>
          <span aria-hidden>·</span>
          <Link href='/privacy' className='font-semibold text-[#1f5d4f] underline-offset-2 hover:underline'>
            プライバシーポリシー
          </Link>
          <span aria-hidden>·</span>
          <Link href='/contact' className='font-semibold text-[#1f5d4f] underline-offset-2 hover:underline'>
            お問い合わせ
          </Link>
        </div>
      </Reveal>
    </Section>
  );
}
