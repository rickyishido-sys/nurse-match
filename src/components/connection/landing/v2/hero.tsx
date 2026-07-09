'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { BrandCharacter } from '@/components/connection/brand/brand-character';
import { AccentSticker, ColorBlob, TiltFrame } from '@/components/connection/brand/brand-editorial';
import { BgTypography } from '@/components/connection/brand/bg-typography';
import { BRAND_SUBLINE, BRAND_TAGLINE, HK } from '@/lib/connection/brand/tokens';

const SLIDES = [
  { src: '/hero/desktop/cafe.png', mobile: '/hero/mobile/cafe.png' },
  { src: '/hero/desktop/bar.png', mobile: '/hero/mobile/bar.png' },
  { src: '/hero/desktop/fitness.png', mobile: '/hero/mobile/fitness.png' },
  { src: '/hero/desktop/flower.png', mobile: '/hero/mobile/flower.png' },
];

const ROTATE_MS = 5000;

function HeroCollage({ index }: { index: number }) {
  const slide = SLIDES[index];
  return (
    <div className='pointer-events-none absolute inset-0' aria-hidden>
      <ColorBlob color={HK.coralSoft} size='h-64 w-64' className='right-[5%] top-[12%] opacity-40' />
      <ColorBlob color={HK.violetSoft} size='h-56 w-56' className='bottom-[20%] left-[3%] opacity-35' />
      <ColorBlob color={HK.skySoft} size='h-40 w-40' className='right-[30%] bottom-[30%] opacity-30' />

      {/* 斜めに重なる写真コラージュ */}
      <TiltFrame tilt={-6} hover={false} className='absolute right-[4%] top-[14%] hidden w-[42%] sm:block'>
        <div className='relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[0_30px_80px_rgba(0,0,0,0.35)] ring-4 ring-white/20'>
          <Image src={slide.src} alt='' fill sizes='45vw' className='object-cover' />
        </div>
      </TiltFrame>
      <TiltFrame tilt={5} hover={false} className='absolute bottom-[18%] right-[18%] hidden w-[28%] sm:block'>
        <div className='relative aspect-square overflow-hidden rounded-[1.5rem] border-4 border-white shadow-2xl'>
          <Image src={SLIDES[(index + 1) % SLIDES.length].mobile} alt='' fill sizes='30vw' className='object-cover' />
        </div>
      </TiltFrame>

      {/* モバイル用フルブリード */}
      <div className='absolute inset-0 sm:hidden'>
        <Image src={slide.mobile} alt='' fill sizes='100vw' className='object-cover' />
      </div>
      <div className='absolute inset-0 bg-gradient-to-br from-[#0f1412]/88 via-[#1f5d4f]/75 to-[#7b5ea7]/55 sm:bg-gradient-to-r sm:from-[#0f1412]/92 sm:via-[#163f35]/80 sm:to-transparent' />
    </div>
  );
}

export function LandingHeroV2({ videoSrc, joinHref = '/register' }: { videoSrc?: string; joinHref?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (videoSrc) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [videoSrc]);

  return (
    <section className='relative flex min-h-[100svh] items-center overflow-hidden bg-[#0f1412]'>
      <HeroCollage index={index} />
      <BgTypography text='華会' dark animate className='!text-white/[0.06]' />

      {/* 散らしたキャラクター */}
      <div className='pointer-events-none absolute left-[6%] top-[20%] z-[5] hidden lg:block'>
        <BrandCharacter id='W' size='lg' variant='float' className='-rotate-12' />
      </div>
      <div className='pointer-events-none absolute bottom-[22%] left-[12%] z-[5]'>
        <BrandCharacter id='E1' size='md' variant='peek' className='rotate-6' />
      </div>
      <div className='pointer-events-none absolute right-[8%] top-[55%] z-[5] sm:right-[45%]'>
        <BrandCharacter id='S' size='sm' variant='float' className='-rotate-8' />
      </div>
      <div className='pointer-events-none absolute bottom-[12%] right-[6%] z-[5] hidden sm:block'>
        <BrandCharacter id='A' size='md' variant='peek' className='rotate-12' />
      </div>

      <div className='relative z-10 mx-auto flex w-full max-w-[1080px] flex-col px-6 pb-24 pt-28 sm:pt-32 lg:max-w-[55%] lg:items-start lg:pl-10 lg:text-left'>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className='flex flex-wrap items-center gap-3'
        >
          <AccentSticker color={HK.coral}>毎週開催中</AccentSticker>
          <span className='text-[11px] font-bold tracking-[0.2em] text-white/70'>華会 HANAKAI</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className='mt-6 font-serif text-[2.1rem] font-bold leading-[1.25] tracking-tight text-white sm:text-[2.8rem] lg:text-[3.4rem]'
        >
          {BRAND_TAGLINE}
          <br />
          <span className='text-white/85'>{BRAND_SUBLINE}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.18 }}
          className='mt-5 max-w-[38ch] text-sm leading-[1.95] text-white/80 sm:text-base'
        >
          スワイプ不要。知らない人との体験が、いつの間にか友達になる。
          花・カフェ・散歩——気分に合った体験を選ぶだけ。
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.28 }}
          className='mt-9 flex w-full flex-col gap-3 sm:flex-row sm:items-center'
        >
          <Link
            href='/events'
            className='hk-brand-btn flex h-14 min-w-[200px] items-center justify-center rounded-full px-8 text-sm font-bold text-white shadow-[0_12px_40px_rgba(232,93,76,0.45)]'
            style={{ background: `linear-gradient(135deg, ${HK.coral} 0%, ${HK.coralSoft} 100%)` }}
          >
            イベントを見る
          </Link>
          <Link
            href={joinHref}
            className='hk-brand-btn flex h-14 items-center justify-center rounded-full border-2 border-white/50 bg-white/10 px-8 text-sm font-semibold text-white backdrop-blur-md'
          >
            新規登録
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className='mt-5 text-xs text-white/55'
        >
          プロフィール作成 → 体験に参加 → つながりが育つ
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className='absolute inset-x-0 bottom-8 z-10 flex justify-center gap-2 text-white/50 lg:justify-start lg:pl-16'
      >
        <span className='text-[10px] font-medium tracking-[0.3em]'>SCROLL</span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className='text-lg'
        >
          ↓
        </motion.span>
      </motion.div>
    </section>
  );
}
