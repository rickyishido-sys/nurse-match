'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';

export function LandingFinalCta() {
  return (
    <section className='relative flex min-h-[78svh] items-center justify-center overflow-hidden'>
      <div className='absolute inset-0'>
        <Image src='/hero/desktop/flower.png' alt='' fill sizes='100vw' className='hidden object-cover lg:block' />
        <Image src='/hero/mobile/flower.png' alt='' fill sizes='100vw' className='block object-cover lg:hidden' />
        <div className='absolute inset-0 bg-black/50' />
        <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/40' />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className='relative z-10 mx-auto flex w-full max-w-[1080px] flex-col items-center px-6 text-center'
      >
        <p className='text-[11px] font-semibold uppercase tracking-[0.36em] text-white/75'>HANAKAI · 花会</p>
        <h2 className='mt-6 font-serif text-[2rem] font-semibold leading-[1.5] tracking-tight text-white sm:text-[2.6rem] lg:text-[3rem]'>
          あなたの日常に、
          <br />
          花と仲間を。
        </h2>

        <div className='mt-10 flex w-full max-w-[360px] flex-col gap-3 sm:max-w-[420px] sm:flex-row sm:justify-center'>
          <Link
            href='/events'
            className='flex h-12 flex-1 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#1a1a1a] shadow-lg transition active:scale-[0.98]'
          >
            イベントを探す
          </Link>
          <Link
            href='/register/profile'
            className='flex h-12 flex-1 items-center justify-center rounded-full bg-[#1f5d4f] px-6 text-sm font-semibold text-white shadow-lg transition active:scale-[0.98]'
          >
            今すぐ始める
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
