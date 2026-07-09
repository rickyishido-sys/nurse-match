'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';

export function LandingFinalCta({ joinHref = '/register' }: { joinHref?: string }) {
  return (
    <section className='relative flex min-h-[72svh] items-center justify-center overflow-hidden sm:min-h-[78svh]'>
      <div className='absolute inset-0'>
        <Image src='/hero/desktop/cafe.png' alt='' fill sizes='100vw' className='hidden object-cover lg:block' />
        <Image src='/hero/mobile/cafe.png' alt='' fill sizes='100vw' className='block object-cover lg:hidden' />
        <div className='absolute inset-0 bg-black/55' />
        <div className='absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/40' />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className='relative z-10 mx-auto flex w-full max-w-[1080px] flex-col items-center px-6 text-center'
      >
        <p className='text-[11px] font-semibold uppercase tracking-[0.32em] text-white/75'>Get started</p>
        <h2 className='mt-5 font-serif text-[1.85rem] font-semibold leading-[1.45] tracking-tight text-white sm:text-[2.4rem] lg:text-[2.8rem]'>
          次の出会いは、
          <br />
          あなたの一歩から
        </h2>
        <p className='mt-5 max-w-[36ch] text-sm leading-7 text-white/85 sm:text-base'>
          プロフィールを作って、気になる体験に参加。
          知らない人との出会いが、日常を少し豊かにします。
        </p>

        <div className='mt-9 flex w-full max-w-[400px] flex-col gap-3 sm:max-w-[460px] sm:flex-row sm:justify-center'>
          <Link
            href='/events'
            className='flex h-[3.25rem] flex-1 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#1a1a1a] shadow-lg transition active:scale-[0.98]'
          >
            イベントを見る
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
