'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { BrandCharacterSlot } from '@/components/connection/brand/brand-character-slot';
import { AccentSticker, ColorBlob, TiltFrame } from '@/components/connection/brand/brand-editorial';
import { BgTypography } from '@/components/connection/brand/bg-typography';
import { BRAND_SUBLINE, HK } from '@/lib/connection/brand/tokens';

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
          <Image src={slide.src} alt='' fill sizes='45vw' className='object-cover' loading='lazy' />
        </div>
      </TiltFrame>
      <TiltFrame tilt={5} hover={false} className='absolute bottom-[18%] right-[18%] hidden w-[28%] sm:block'>
        <div className='relative aspect-square overflow-hidden rounded-[1.5rem] border-4 border-white shadow-2xl'>
          <Image src={SLIDES[(index + 1) % SLIDES.length].mobile} alt='' fill sizes='30vw' className='object-cover' />
        </div>
      </TiltFrame>

      {/* モバイル用フルブリード */}
      <div className='absolute inset-0 sm:hidden'>
        <Image
          src={slide.mobile}
          alt=''
          fill
          sizes='100vw'
          className='object-cover'
          priority={index === 0}
          fetchPriority={index === 0 ? 'high' : 'auto'}
        />
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

      {/* キャラクタースロット — brand-config.ts で再有効化 */}
      <BrandCharacterSlot id='W' size='lg' variant='float' className='-rotate-12' wrapperClassName='absolute left-[6%] top-[20%] z-[5] hidden lg:block' />
      <BrandCharacterSlot id='E1' size='md' variant='peek' className='rotate-6' wrapperClassName='absolute bottom-[22%] left-[12%] z-[5]' />
      <BrandCharacterSlot id='S' size='sm' variant='float' className='-rotate-8' wrapperClassName='absolute right-[8%] top-[55%] z-[5] sm:right-[45%]' />
      <BrandCharacterSlot id='A' size='md' variant='peek' className='rotate-12' wrapperClassName='absolute bottom-[12%] right-[6%] z-[5] hidden sm:block' />

      <div className='relative z-10 mx-auto flex w-full max-w-[1080px] flex-col px-6 pb-24 pt-[calc(7rem+env(safe-area-inset-top,0px))] sm:pt-[calc(8rem+env(safe-area-inset-top,0px))] lg:max-w-[55%] lg:items-start lg:pl-10 lg:text-left'>
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
          <span className='hk-copy-ja block'>人との時間を華やかにする。</span>
          <span className='hk-copy-ja block text-white/85'>{BRAND_SUBLINE}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.18 }}
          className='hk-copy-ja mt-5 max-w-[42ch] text-sm leading-[1.95] text-white/80 sm:max-w-[48ch] sm:text-base'
        >
          <span className='block'>スワイプ不要。</span>
          <span className='block sm:inline'>花・カフェ・食事・散歩など、</span>
          <span className='block sm:inline'>好きなことを通じて、新しい休日を過ごす。</span>
          <span className='mt-2 block sm:mt-0'>一緒に過ごす時間から、自然なつながりが生まれます。</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.28 }}
          className='mt-9 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'
        >
          <Link
            href='/events'
            prefetch
            className='hk-brand-btn flex h-14 min-w-[200px] flex-1 items-center justify-center rounded-full px-8 text-sm font-bold text-white shadow-[0_12px_40px_rgba(232,93,76,0.45)] sm:flex-none'
            style={{ background: `linear-gradient(135deg, ${HK.coral} 0%, ${HK.coralSoft} 100%)` }}
          >
            イベントを見る
          </Link>
          <Link
            href='/events/create'
            prefetch
            className='hk-brand-btn flex h-14 min-w-[200px] flex-1 items-center justify-center rounded-full border-2 border-white/70 bg-white/15 px-8 text-sm font-bold text-white backdrop-blur-md sm:flex-none'
          >
            イベントを作る
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.34 }}
          className='mt-4 flex flex-wrap items-center gap-4'
        >
          <Link
            href={joinHref}
            prefetch
            className='text-sm font-semibold text-white/90 underline-offset-4 hover:underline'
          >
            新規登録はこちら
          </Link>
          <Link
            href='#host-events'
            className='text-sm font-semibold text-white/70 underline-offset-4 hover:text-white hover:underline'
          >
            イベントの作り方を見る
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className='mt-5 text-xs text-white/55'
        >
          プロフィール作成 → 体験を選ぶ → 参加申請 → リアル体験
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
