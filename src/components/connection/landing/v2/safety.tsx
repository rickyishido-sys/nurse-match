'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ColorBlob, TiltFrame } from '@/components/connection/brand/brand-editorial';
import { HK } from '@/lib/connection/brand/tokens';
import { Heading, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';

function Line({ children, color }: { children: ReactNode; color: string }) {
  return (
    <svg
      viewBox='0 0 48 48'
      className='h-12 w-12'
      fill='none'
      stroke={color}
      strokeWidth={1.6}
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
    <Line color={HK.coral}>
      <path d='M24 5l15 6v9c0 10-6.4 16.8-15 19-8.6-2.2-15-9-15-19v-9l15-6z' />
      <path d='M17 23l5 5 9-10' />
    </Line>
  ),
  identity: (
    <Line color={HK.violet}>
      <rect x='7' y='11' width='34' height='26' rx='3' />
      <circle cx='18' cy='23' r='4' />
      <path d='M12 32c1-3.2 4-5 6-5s5 1.8 6 5' />
      <path d='M29 19h7M29 25h7M29 31h4' />
    </Line>
  ),
  report: (
    <Line color={HK.sky}>
      <path d='M11 6v36' />
      <path d='M11 8h22l-3 6 3 6H11' />
    </Line>
  ),
  admin: (
    <Line color={HK.amber}>
      <circle cx='24' cy='14' r='5' />
      <path d='M10 40c2-8 8-12 14-12s12 4 14 12' />
      <path d='M32 22l4 4-4 4' />
    </Line>
  ),
  guideline: (
    <Line color={HK.lime}>
      <path d='M13 6h16l6 6v30H13z' />
      <path d='M29 6v6h6' />
      <path d='M18 24h12M18 30h12M18 18h6' />
    </Line>
  ),
  block: (
    <Line color={HK.coral}>
      <circle cx='24' cy='24' r='15' />
      <path d='M13.5 13.5l21 21' />
    </Line>
  ),
};

const ITEMS = [
  { icon: 'review', title: '参加審査', body: '主催者または運営が参加申請を確認し、心地よい場を保ちます。', accent: HK.coral, tilt: -3 },
  { icon: 'report', title: '通報機能', body: '気になる言動は、アプリからいつでも運営へ通報できます。', accent: HK.sky, tilt: -2 },
  { icon: 'block', title: 'ブロック機能', body: 'つながりたくない相手とは、自分で距離を取れます。', accent: HK.coral, tilt: 3 },
  { icon: 'admin', title: '運営管理体制', body: '通報・問い合わせに運営が対応し、必要に応じて利用制限を行います。', accent: HK.amber, tilt: 5 },
  { icon: 'guideline', title: 'コミュニティガイドライン', body: '尊重と安心のための共通ルールを定めています。', accent: HK.lime, tilt: -4 },
  { icon: 'identity', title: '本人確認の提出', body: '任意で本人確認書類を提出できます。運営が確認し、安心の参考情報として扱います。', accent: HK.violet, tilt: 4 },
] as const;

export function LandingSafety() {
  return (
    <Section tone='cream' className='relative overflow-hidden !bg-gradient-to-b from-[#f5f0ff] via-[#faf7f2] to-[#fff8f5]'>
      <ColorBlob color={HK.limeSoft} className='left-[-5%] top-[15%]' />
      <ColorBlob color={HK.coralSoft} className='right-[-4%] bottom-[8%]' />

      <div className='relative z-10 flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>Safety</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>安心して参加できる仕組み</Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead className='mt-6 max-w-[42ch]'>
            はじめての方も、一人参加も大歓迎。
            参加審査・通報・ブロック・運営対応で、安心して体験に集中できます。
          </Lead>
        </Reveal>
      </div>

      <div className='relative z-10 mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8'>
        {ITEMS.map((item, i) => (
          <Reveal key={item.title} delay={0.04 * i}>
            <TiltFrame tilt={item.tilt}>
              <div
                className='flex flex-col rounded-[1.75rem] px-6 py-7 shadow-[0_16px_40px_rgba(0,0,0,0.08)]'
                style={{
                  background: `linear-gradient(150deg, ${item.accent}12 0%, white 60%)`,
                  borderBottom: `3px solid ${item.accent}`,
                }}
              >
                <div
                  className='flex h-14 w-14 items-center justify-center rounded-2xl'
                  style={{ backgroundColor: `${item.accent}22` }}
                >
                  {ICONS[item.icon]}
                </div>
                <p className='mt-5 text-base font-bold text-[#1a1a1a]'>{item.title}</p>
                <p className='mt-2 text-sm leading-[1.85] text-[#5a5247]'>{item.body}</p>
              </div>
            </TiltFrame>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.18}>
        <div className='relative z-10 mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-[#6b6b6b]'>
          <Link href='/community-guidelines' className='font-bold text-[#1f5d4f] underline-offset-2 hover:underline'>
            コミュニティガイドライン
          </Link>
          <span aria-hidden>·</span>
          <Link href='/privacy' className='font-bold text-[#1f5d4f] underline-offset-2 hover:underline'>
            プライバシーポリシー
          </Link>
          <span aria-hidden>·</span>
          <Link href='/contact' className='font-bold text-[#1f5d4f] underline-offset-2 hover:underline'>
            お問い合わせ
          </Link>
        </div>
      </Reveal>
    </Section>
  );
}
