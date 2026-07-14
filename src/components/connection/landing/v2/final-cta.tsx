'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { BrandCharacterSlot } from '@/components/connection/brand/brand-character-slot';
import { AccentSticker, ColorBlob, TiltFrame } from '@/components/connection/brand/brand-editorial';
import { HK } from '@/lib/connection/brand/tokens';

export function LandingFinalCta({ joinHref = '/register' }: { joinHref?: string }) {
  return (
    <section className='relative flex min-h-[75svh] items-center overflow-hidden'>
      <div className='absolute inset-0'>
        <TiltFrame tilt={-2} hover={false} className='absolute inset-0'>
          <Image src='/hero/desktop/bar.png' alt='' fill sizes='100vw' className='object-cover' />
        </TiltFrame>
        <div className='absolute inset-0 bg-gradient-to-br from-[#7b5ea7]/80 via-[#1f5d4f]/85 to-[#0f1412]/90' />
      </div>
      <ColorBlob color={HK.coralSoft} className='left-[10%] top-[20%] opacity-60' />
      <ColorBlob color={HK.amberSoft} className='right-[15%] bottom-[25%] opacity-50' />

      <BrandCharacterSlot id='W' size='lg' variant='peek' className='-rotate-6' wrapperClassName='absolute bottom-[15%] left-[8%]' />
      <BrandCharacterSlot id='E2' size='md' variant='float' className='rotate-10' wrapperClassName='absolute right-[10%] top-[20%]' />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className='relative z-10 mx-auto flex w-full max-w-[1080px] flex-col items-center px-6 text-center'
      >
        <AccentSticker color={HK.coral}>参加する準備はできましたか？</AccentSticker>
        <h2 className='mt-6 font-serif text-[2rem] font-bold leading-[1.3] tracking-tight text-white sm:text-[2.6rem]'>
          次の出会いは、
          <br />
          あなたの一歩から
        </h2>
        <p className='mt-5 max-w-[36ch] text-sm leading-8 text-white/85 sm:text-base'>
          プロフィールを作って、気になる体験に参加。
          知らない人との時間が、日常を華やかにします。
        </p>

        <div className='mt-10 flex w-full max-w-[480px] flex-col gap-3 sm:flex-row sm:justify-center'>
          <Link
            href='/events'
            className='hk-brand-btn flex h-14 flex-1 items-center justify-center rounded-full px-8 text-sm font-bold text-[#1a1a1a] shadow-xl'
            style={{ background: 'white' }}
          >
            イベントを見る
          </Link>
          <Link
            href='/events/create'
            className='hk-brand-btn flex h-14 flex-1 items-center justify-center rounded-full px-8 text-sm font-bold text-white shadow-xl'
            style={{ background: HK.coral }}
          >
            イベントを作る
          </Link>
        </div>
        <Link
          href={joinHref}
          className='mt-4 inline-flex min-h-11 items-center justify-center rounded-full border-2 border-white/60 px-8 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/10'
        >
          新規登録
        </Link>
      </motion.div>
    </section>
  );
}
