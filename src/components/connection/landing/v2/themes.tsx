'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BrandCharacterSlot } from '@/components/connection/brand/brand-character-slot';
import { ColorBlob, TiltFrame } from '@/components/connection/brand/brand-editorial';
import { Heading, HK, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';

type Theme = {
  en: string;
  jp: string;
  emoji: string;
  img?: string;
  href: string;
  tilt: number;
  bg: string;
  accent: string;
  char?: 'D1' | 'N' | 'E2' | 'A';
};

const THEMES: Theme[] = [
  { en: 'Flower', jp: '花を束ねる', emoji: '🌸', img: '/categories/flower.png', href: '/events?category=flower', tilt: -3, bg: '#fff0f5', accent: HK.blush, char: 'A' },
  { en: 'Coffee', jp: 'カフェで話す', emoji: '☕️', img: '/categories/cafe.png', href: '/events?category=coffee', tilt: 2, bg: '#fff8ec', accent: HK.amber },
  { en: 'Dinner', jp: '食卓を囲む', emoji: '🍽️', href: '/events?category=business', tilt: -2, bg: '#f5f0ff', accent: HK.violet, char: 'D1' },
  { en: 'Bar', jp: '一杯を傾ける', emoji: '🍷', img: '/categories/bar.png', href: '/events?category=bar', tilt: 4, bg: '#fff0ec', accent: HK.coral },
  { en: 'Stroll', jp: '街を歩く', emoji: '🍃', img: '/categories/stroll.png', href: '/events?category=walking', tilt: -4, bg: '#ecfff3', accent: HK.lime, char: 'N' },
  { en: 'Fitness', jp: '体を動かす', emoji: '🤸', img: '/categories/fitness.png', href: '/events?category=fitness', tilt: 3, bg: '#f0f8ff', accent: HK.sky },
  { en: 'Darts', jp: 'ダーツで遊ぶ', emoji: '🎯', href: '/events', tilt: -2, bg: '#fff5f0', accent: '#e85d4c', char: 'E2' },
  { en: 'Art', jp: 'つくる時間', emoji: '🎨', href: '/events?category=workshop', tilt: 5, bg: '#f8f0ff', accent: HK.violetSoft },
];

export function LandingThemes() {
  return (
    <Section tone='white' className='relative overflow-hidden'>
      <ColorBlob color={HK.amberSoft} className='left-[10%] top-[5%] opacity-50' />
      <ColorBlob color={HK.limeSoft} className='right-[8%] bottom-[8%] opacity-40' />
      <BrandCharacterSlot id='D2' size='lg' variant='float' className='rotate-12' wrapperClassName='absolute right-[5%] top-[12%] hidden md:block' />

      <div className='relative z-10 flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>Experiences</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>体験から選ぶ</Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead className='mt-6 max-w-[42ch]'>
            整然と並べたカードではなく、気分に合わせて拾い上げる体験のコレクション。
          </Lead>
        </Reveal>
      </div>

      <Reveal delay={0.12}>
        <div className='relative z-10 mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5'>
          {THEMES.map((theme, i) => (
            <TiltFrame key={theme.en} tilt={theme.tilt} className={i % 3 === 1 ? 'sm:mt-6' : i % 3 === 2 ? 'sm:mt-3' : ''}>
              <Link
                href={theme.href}
                className='group relative flex flex-col items-center overflow-visible rounded-[1.75rem] px-3 py-7 text-center shadow-[0_12px_40px_rgba(26,26,26,0.08)] transition sm:px-4 sm:py-9'
                style={{ background: theme.bg }}
              >
                {theme.char ? (
                  <BrandCharacterSlot
                    id={theme.char}
                    size='xs'
                    variant='peek'
                    wrapperClassName='absolute -right-1 -top-2 z-10 scale-75 sm:scale-90'
                  />
                ) : null}
                <div
                  className='flex h-16 w-16 items-center justify-center rounded-2xl sm:h-20 sm:w-20'
                  style={{ background: `${theme.accent}22` }}
                >
                  {theme.img ? (
                    <div className='relative h-11 w-11 sm:h-14 sm:w-14'>
                      <Image src={theme.img} alt={theme.en} fill sizes='56px' className='object-contain' />
                    </div>
                  ) : (
                    <span className='text-2xl sm:text-3xl' aria-hidden>
                      {theme.emoji}
                    </span>
                  )}
                </div>
                <p className='mt-3 text-xs font-bold tracking-wide sm:text-sm' style={{ color: theme.accent }}>
                  {theme.en}
                </p>
                <p className='mt-0.5 text-[10px] font-medium text-[#6b6b6b] sm:text-[11px]'>{theme.jp}</p>
              </Link>
            </TiltFrame>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <div className='relative z-10 mt-12 flex justify-center'>
          <Link
            href='/events'
            className='hk-brand-btn flex h-14 min-w-[220px] items-center justify-center rounded-full px-8 text-sm font-bold text-white'
            style={{ background: `linear-gradient(135deg, ${HK.green}, ${HK.greenLight})` }}
          >
            イベントを見る
          </Link>
        </div>
      </Reveal>
    </Section>
  );
}
