'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

const SLIDES = [
  { src: '/hero/desktop/cafe.png', mobile: '/hero/mobile/cafe.png', label: 'カフェで話す' },
  { src: '/hero/desktop/Stroll.png', mobile: '/hero/mobile/Stroll.png', label: '街を歩く' },
  { src: '/hero/desktop/bar.png', mobile: '/hero/mobile/bar.png', label: '一杯を傾ける' },
  { src: '/hero/desktop/fitness.png', mobile: '/hero/mobile/fitness.png', label: '体を動かす' },
  { src: '/hero/desktop/flower.png', mobile: '/hero/mobile/flower.png', label: '花をつくる' },
];

const ROTATE_MS = 5600;

function HeroBackground({ videoSrc, poster }: { videoSrc?: string; poster?: string }) {
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (reduced || videoSrc) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [reduced, videoSrc]);

  return (
    <div className='absolute inset-0 overflow-hidden' aria-hidden>
      <div className='absolute inset-0 bg-gradient-to-br from-[#24463b] via-[#1f5d4f] to-[#13261f]' />

      {videoSrc ? (
        <video className='absolute inset-0 h-full w-full object-cover' autoPlay muted loop playsInline poster={poster}>
          <source src={videoSrc} />
        </video>
      ) : (
        SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={slide.src}
              alt=''
              fill
              priority={i === 0}
              sizes='100vw'
              className={`hidden object-cover lg:block ${i === index && !reduced ? 'hk-kenburns' : ''}`}
            />
            <Image
              src={slide.mobile}
              alt=''
              fill
              priority={i === 0}
              sizes='100vw'
              className={`block object-cover lg:hidden ${i === index && !reduced ? 'hk-kenburns' : ''}`}
            />
          </div>
        ))
      )}

      <div className='absolute inset-0 bg-black/50' />
      <div className='absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/45' />

      <style jsx global>{`
        @keyframes hk-kenburns {
          from {
            transform: scale(1.02);
          }
          to {
            transform: scale(1.12);
          }
        }
        .hk-kenburns {
          animation: hk-kenburns ${ROTATE_MS + 1800}ms ease-out forwards;
          transform-origin: center;
        }
        @media (prefers-reduced-motion: reduce) {
          .hk-kenburns {
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}

export function LandingHeroV2({ videoSrc, joinHref = '/register' }: { videoSrc?: string; joinHref?: string }) {
  return (
    <section className='relative flex min-h-[100svh] items-center justify-center overflow-hidden'>
      <HeroBackground videoSrc={videoSrc} />

      <div className='relative z-10 mx-auto flex w-full max-w-[1080px] flex-col items-center px-6 pt-20 text-center sm:pt-24'>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className='inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-white/90 backdrop-blur'
        >
          リアルで出会う Connection コミュニティ
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className='mt-6 font-serif text-[1.85rem] font-semibold leading-[1.45] tracking-tight text-white sm:text-[2.5rem] lg:text-[3rem]'
        >
          体験を通じて、
          <br />
          知らない人とつながる
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className='mt-5 max-w-[40ch] text-sm leading-[1.95] text-white/88 sm:text-base'
        >
          花・コーヒー・食事・散歩など、興味のある体験に参加。
          <br className='hidden sm:block' />
          スワイプ不要。一人参加OK。運営が見守る、安心の場です。
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className='mt-9 flex w-full max-w-[400px] flex-col gap-3 sm:max-w-[460px] sm:flex-row sm:justify-center'
        >
          <Link
            href={joinHref}
            className='flex h-[3.25rem] flex-1 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#1a1a1a] shadow-lg transition active:scale-[0.98]'
          >
            参加登録する
          </Link>
          <Link
            href='/events'
            className='flex h-[3.25rem] flex-1 items-center justify-center rounded-full border border-white/70 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 active:scale-[0.98]'
          >
            イベントを見る
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.48 }}
          className='mt-6 text-[11px] tracking-wide text-white/65'
        >
          プロフィール作成 → イベント参加 → Connection開始
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className='absolute inset-x-0 bottom-7 z-10 flex flex-col items-center gap-2 text-white/70'
      >
        <span className='text-[10px] font-medium tracking-[0.3em]'>SCROLL</span>
        <span className='relative flex h-9 w-5 justify-center rounded-full border border-white/50'>
          <motion.span
            animate={{ y: [3, 14, 3], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className='mt-1.5 h-1.5 w-1.5 rounded-full bg-white'
          />
        </span>
      </motion.div>
    </section>
  );
}
