'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { BrandCharacter } from '@/components/connection/brand/brand-character';
import type { BrandCharacterId } from '@/lib/connection/brand/characters';

type TiltProps = {
  children: ReactNode;
  tilt?: number;
  className?: string;
  hover?: boolean;
};

/** 斜めに傾いたフレーム（Timeleft的な自由さ） */
export function TiltFrame({ children, tilt = -3, className = '', hover = true }: TiltProps) {
  const inner = (
    <div
      className={className}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {children}
    </div>
  );

  if (!hover) return inner;

  return (
    <motion.div
      whileHover={{ rotate: tilt + 1.5, scale: 1.02 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ transform: `rotate(${tilt}deg)` }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type BlobProps = {
  color: string;
  size?: string;
  className?: string;
  blur?: string;
};

/** 背景のカラーブロブ */
export function ColorBlob({ color, size = 'h-48 w-48', className = '', blur = 'blur-3xl' }: BlobProps) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full opacity-70 ${size} ${blur} ${className}`}
      style={{ background: color }}
      aria-hidden
    />
  );
}

type ScatterProps = {
  ids: BrandCharacterId[];
  className?: string;
};

/** キャラクターをランダム感で散らす */
export function ScatterCharacters({ ids, className = '' }: ScatterProps) {
  const positions = [
    { top: '8%', left: '4%', size: 'sm' as const, tilt: -12 },
    { top: '20%', right: '6%', size: 'md' as const, tilt: 8 },
    { bottom: '15%', left: '10%', size: 'md' as const, tilt: -6 },
    { bottom: '25%', right: '8%', size: 'sm' as const, tilt: 14 },
    { top: '45%', right: '2%', size: 'xs' as const, tilt: -10 },
  ];

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {ids.map((id, i) => {
        const pos = positions[i % positions.length];
        const style: Record<string, string> = {};
        if ('top' in pos && pos.top) style.top = pos.top;
        if ('bottom' in pos && pos.bottom) style.bottom = pos.bottom;
        if ('left' in pos && pos.left) style.left = pos.left;
        if ('right' in pos && pos.right) style.right = pos.right;
        return (
          <div key={id} className='absolute' style={{ ...style, transform: `rotate(${pos.tilt}deg)` }}>
            <BrandCharacter id={id} size={pos.size} variant='float' />
          </div>
        );
      })}
    </div>
  );
}

/** 斜めのステッカー風ラベル */
export function AccentSticker({
  children,
  color = '#e85d4c',
  tilt = -4,
}: {
  children: ReactNode;
  color?: string;
  tilt?: number;
}) {
  return (
    <span
      className='inline-block rounded-lg px-3 py-1 text-[11px] font-bold tracking-wide text-white shadow-md'
      style={{ background: color, transform: `rotate(${tilt}deg)` }}
    >
      {children}
    </span>
  );
}
