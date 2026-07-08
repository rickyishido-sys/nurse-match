import Image from 'next/image';
import Link from 'next/link';
import { Heading, HK, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';

type Theme = {
  en: string;
  jp: string;
  emoji: string;
  img?: string;
  href: string;
};

// 花は入口・象徴のひとつ。多様な体験テーマを横並びで見せる。
const THEMES: Theme[] = [
  { en: 'Flower', jp: '花を束ねる', emoji: '🌸', img: '/categories/flower.png', href: '/events?category=flower' },
  { en: 'Coffee', jp: 'カフェで話す', emoji: '☕️', img: '/categories/cafe.png', href: '/events?category=coffee' },
  { en: 'Dinner', jp: '食卓を囲む', emoji: '🍽️', href: '/events?category=business' },
  { en: 'Bar', jp: '一杯を傾ける', emoji: '🍷', img: '/categories/bar.png', href: '/events?category=bar' },
  { en: 'Stroll', jp: '街を歩く', emoji: '🍃', img: '/categories/stroll.png', href: '/events?category=walking' },
  { en: 'Fitness', jp: '体を動かす', emoji: '🤸', img: '/categories/fitness.png', href: '/events?category=fitness' },
  { en: 'Darts', jp: 'ダーツで遊ぶ', emoji: '🎯', href: '/events' },
  { en: 'Art', jp: 'つくる時間', emoji: '🎨', href: '/events?category=workshop' },
];

export function LandingThemes() {
  return (
    <Section tone='cream'>
      <div className='flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>Point 03</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>体験から選ぶ</Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead className='mt-6 max-w-[42ch]'>
            花、カフェ、食事、散歩、運動など。
            気分に合った体験を選んで、新しいConnectionを見つけてください。
          </Lead>
        </Reveal>
      </div>

      <Reveal delay={0.15}>
        <div className='mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4'>
          {THEMES.map((theme) => (
            <Link
              key={theme.en}
              href={theme.href}
              className='group flex flex-col items-center rounded-3xl border border-[#ece3d4] bg-white px-4 py-8 text-center shadow-[0_4px_18px_rgba(26,26,26,0.04)] transition active:scale-[0.98]'
            >
              <div className='flex h-20 w-20 items-center justify-center rounded-full bg-[#faf7f2] sm:h-24 sm:w-24'>
                {theme.img ? (
                  <div className='relative h-14 w-14 sm:h-16 sm:w-16'>
                    <Image src={theme.img} alt={theme.en} fill sizes='64px' className='object-contain' />
                  </div>
                ) : (
                  <span className='text-3xl sm:text-4xl' aria-hidden>
                    {theme.emoji}
                  </span>
                )}
              </div>
              <p className='mt-4 text-sm font-semibold tracking-[0.08em]' style={{ color: HK.green }}>
                {theme.en}
              </p>
              <p className='mt-1 text-[11px] text-[#8a8378]'>{theme.jp}</p>
            </Link>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <div className='mt-12 flex justify-center'>
          <Link
            href='/events'
            className='flex h-12 min-w-[220px] items-center justify-center rounded-full bg-[#1f5d4f] px-8 text-sm font-semibold text-white shadow-md transition active:scale-[0.98]'
          >
            イベントを見る
          </Link>
        </div>
      </Reveal>
    </Section>
  );
}
