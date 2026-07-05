'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

// 表紙画像（主催者動画/画像が未設定のときの既定ビジュアル）。
// 花に寄りすぎないよう、さまざまな体験テーマを順番に見せる。
const SLIDES = [
  { src: '/hero/desktop/cafe.png', mobile: '/hero/mobile/cafe.png' },
  { src: '/hero/desktop/Stroll.png', mobile: '/hero/mobile/Stroll.png' },
  { src: '/hero/desktop/bar.png', mobile: '/hero/mobile/bar.png' },
  { src: '/hero/desktop/fitness.png', mobile: '/hero/mobile/fitness.png' },
  { src: '/hero/desktop/flower.png', mobile: '/hero/mobile/flower.png' },
];

const ROTATE_MS = 5600;

/**
 * Hero 背景。優先度: 主催者の動画/画像 → 既定動画 → 既定画像スライド。
 * いまは動画素材未配置のため、既定画像スライド（Ken Burns + クロスフェード）を表示。
 * videoSrc を渡せばそのまま動画背景に差し替わる設計。
 */
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
        <video
          className='absolute inset-0 h-full w-full object-cover'
          autoPlay
          muted
          loop
          playsInline
          poster={poster}
        >
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

      {/* 黒のグラデーションオーバーレイ（可読性） */}
      <div className='absolute inset-0 bg-black/45' />
      <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40' />

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

export function LandingHeroV2({ videoSrc, joinHref = '/register/continue' }: { videoSrc?: string; joinHref?: string }) {
  return (
    <section className='relative flex min-h-[100svh] items-center justify-center overflow-hidden'>
      <HeroBackground videoSrc={videoSrc} />

      <div className='relative z-10 mx-auto flex w-full max-w-[1080px] flex-col items-center px-6 text-center'>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className='text-[12px] font-semibold uppercase tracking-[0.42em] text-white/80'
        >
          HANAKAI · 花会
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className='mt-6 font-serif text-[2rem] font-semibold leading-[1.5] tracking-tight text-white sm:text-[2.6rem] lg:text-[3.2rem]'
        >
          いつもの日常に、
          <br />
          新しい出会いを。
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className='mt-6 max-w-[36ch] text-sm leading-[2] text-white/85 sm:text-base'
        >
          花、カフェ、散歩、食事、バー、アート。
          <br className='hidden sm:block' />
          さまざまな体験を通じて、普段出会わない人と自然につながる。
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className='mt-10 flex w-full max-w-[360px] flex-col gap-3 sm:max-w-[420px] sm:flex-row sm:justify-center'
        >
          <Link
            href='/events'
            className='flex h-12 flex-1 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#1a1a1a] shadow-lg transition active:scale-[0.98]'
          >
            イベントを見る
          </Link>
          <Link
            href={joinHref}
            className='flex h-12 flex-1 items-center justify-center rounded-full border border-white/70 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 active:scale-[0.98]'
          >
            コミュニティに参加する
          </Link>
        </motion.div>
      </div>

      {/* スクロールを促すアニメーション */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
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
