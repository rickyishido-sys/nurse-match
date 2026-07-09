'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { BRAND_CHARACTERS, type BrandCharacterId } from '@/lib/connection/brand/characters';

const SIZE_MAP = {
  xs: { box: 'h-12 w-12', text: 'text-lg', peek: '-right-2 -top-2' },
  sm: { box: 'h-16 w-16', text: 'text-xl', peek: '-right-3 -top-3' },
  md: { box: 'h-24 w-24', text: 'text-3xl', peek: '-right-4 -top-4' },
  lg: { box: 'h-32 w-32', text: 'text-4xl', peek: '-right-5 -top-5' },
  xl: { box: 'h-40 w-40 sm:h-48 sm:w-48', text: 'text-5xl', peek: '-right-6 -top-6' },
} as const;

type Props = {
  id: BrandCharacterId;
  size?: keyof typeof SIZE_MAP;
  /** contained=枠内 / peek=枠から飛び出す / float=浮遊アニメ */
  variant?: 'contained' | 'peek' | 'float';
  imageSrc?: string;
  className?: string;
  label?: boolean;
};

export function BrandCharacter({
  id,
  size = 'md',
  variant = 'contained',
  imageSrc,
  className = '',
  label = false,
}: Props) {
  const char = BRAND_CHARACTERS[id];
  const src = imageSrc ?? char.imageSrc;
  const s = SIZE_MAP[size];
  const peekOffset = variant === 'peek' ? s.peek : '';

  const inner = (
    <div
      className={`relative flex ${s.box} items-center justify-center overflow-visible rounded-[28%] bg-gradient-to-br ${char.gradient} shadow-[0_16px_48px_rgba(0,0,0,0.15)] ring-2 ring-white/30 ${peekOffset} ${className}`}
      title={char.name}
    >
      {src ? (
        <Image src={src} alt={char.name} fill sizes='200px' className='object-contain p-1' />
      ) : (
        <span className={`select-none font-serif font-semibold text-white/95 ${s.text}`}>{char.letter}</span>
      )}
      <div className='pointer-events-none absolute inset-0 rounded-[28%] bg-gradient-to-t from-black/15 to-transparent' />
    </div>
  );

  const wrapped =
    variant === 'float' ? (
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {inner}
      </motion.div>
    ) : (
      inner
    );

  if (!label) return wrapped;

  return (
    <div className='flex flex-col items-center gap-2'>
      {wrapped}
      <span className='text-[10px] font-medium tracking-wide text-[#6b6b6b]'>{char.name}</span>
    </div>
  );
}
