'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

type Slide = {
  key: string;
  desktop: string;
  mobile: string;
  alt: string;
};

// 表示順: flower → cafe → bar → fitness → Stroll
const SLIDES: Slide[] = [
  { key: 'flower', desktop: '/hero/desktop/flower.png', mobile: '/hero/mobile/flower.png', alt: 'Flower Connection — 花を介したつながり' },
  { key: 'cafe', desktop: '/hero/desktop/cafe.png', mobile: '/hero/mobile/cafe.png', alt: 'Coffee Connection — 一杯のコーヒーから始まる対話' },
  { key: 'bar', desktop: '/hero/desktop/bar.png', mobile: '/hero/mobile/bar.png', alt: 'Bar Connection — 心ほどける夜のひととき' },
  { key: 'fitness', desktop: '/hero/desktop/fitness.png', mobile: '/hero/mobile/fitness.png', alt: 'Fitness Connection — 体を動かしたあとの軽やかな会話' },
  { key: 'stroll', desktop: '/hero/desktop/Stroll.png', mobile: '/hero/mobile/Stroll.png', alt: 'Walking Connection — 歩きながら自然にほどける時間' },
];

const ROTATE_MS = 5000;
const FALLBACK = 'bg-gradient-to-br from-[#24463b] via-[#1f5d4f] to-[#13261f]';

/** 単一バリアント画像（読み込み失敗時は深いグリーンのグラデーションへフォールバック）。 */
function HeroImage({
  src,
  alt,
  priority,
  variant,
  active,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  variant: 'desktop' | 'mobile';
  active: boolean;
}) {
  const [failed, setFailed] = useState(false);
  // PC は lg 以上で desktop、それ未満（スマホ・タブレット）は mobile を使用
  const visibility = variant === 'desktop' ? 'hidden lg:block' : 'block lg:hidden';

  if (failed) return null;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={variant === 'desktop' ? '100vw' : '100vw'}
      onError={() => setFailed(true)}
      className={`${visibility} object-cover ${active ? 'hero-kb-active' : ''}`}
    />
  );
}

export function HeroSlider() {
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
    if (reduced) return; // prefers-reduced-motion: 自動切り替えを停止
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [reduced]);

  return (
    <div className='absolute inset-0 overflow-hidden' aria-hidden>
      {/* 最背面: 画像未配置・読み込み失敗時のフォールバック */}
      <div className={`absolute inset-0 ${FALLBACK}`} />

      {SLIDES.map((slide, i) => {
        const active = i === index;
        return (
          <div
            key={slide.key}
            className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
              active ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <HeroImage src={slide.desktop} alt={slide.alt} variant='desktop' priority={i === 0} active={active && !reduced} />
            <HeroImage src={slide.mobile} alt={slide.alt} variant='mobile' priority={i === 0} active={active && !reduced} />
          </div>
        );
      })}

      {/* 黒のオーバーレイ rgba(0,0,0,0.35) + テキスト可読性のための柔らかなグラデーション */}
      <div className='absolute inset-0 bg-black/35' />
      <div className='absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent' />
      <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent' />

      {/* インジケーター（5個のドット） */}
      <div className='pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center'>
        <div className='pointer-events-auto flex items-center gap-2 rounded-full bg-black/20 px-3 py-2 backdrop-blur-sm'>
          {SLIDES.map((slide, i) => (
            <button
              key={slide.key}
              type='button'
              aria-label={`スライド ${i + 1} を表示`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes hero-kenburns {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.08);
          }
        }
        .hero-kb-active {
          animation: hero-kenburns ${ROTATE_MS + 1500}ms ease-out forwards;
          transform-origin: center;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-kb-active {
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
