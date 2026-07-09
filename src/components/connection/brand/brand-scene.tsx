'use client';

import type { ReactNode } from 'react';
import { BgTypography } from '@/components/connection/brand/bg-typography';
import { BrandCharacter } from '@/components/connection/brand/brand-character';
import { BRAND_SUBLINE, BRAND_TAGLINE } from '@/lib/connection/brand/tokens';
import { PAGE_CHARACTERS, type BrandCharacterId } from '@/lib/connection/brand/characters';

type Props = {
  children: ReactNode;
  bgText?: string;
  characters?: BrandCharacterId[];
  className?: string;
  tone?: 'cream' | 'warm' | 'dark';
};

/** ページシーン — 背景タイポ + キャラクタースロット */
export function BrandScene({
  children,
  bgText = '華会',
  characters,
  className = '',
  tone = 'cream',
}: Props) {
  const chars = characters ?? [];
  const bg =
    tone === 'dark'
      ? 'bg-[#163f35]'
      : tone === 'warm'
        ? 'bg-[#f3ebe0]/50'
        : 'bg-[#faf7f2]';

  return (
    <div className={`relative overflow-hidden ${bg} ${className}`}>
      <BgTypography text={bgText} dark={tone === 'dark'} />
      {chars.map((id, i) => (
        <div
          key={id}
          className='pointer-events-none absolute z-[1]'
          style={{
            top: `${12 + i * 8}%`,
            right: `${4 + i * 6}%`,
            opacity: 0.85 - i * 0.1,
          }}
        >
          <BrandCharacter id={id} size={i === 0 ? 'md' : 'sm'} variant='float' />
        </div>
      ))}
      <div className='relative z-[2]'>{children}</div>
    </div>
  );
}

export function BrandTagline({ dark = false }: { dark?: boolean }) {
  return (
    <div className={dark ? 'text-white/80' : 'text-[#5a5247]'}>
      <p className='font-serif text-sm font-semibold tracking-wide sm:text-base'>{BRAND_TAGLINE}</p>
      <p className='mt-1 text-xs leading-relaxed opacity-80'>{BRAND_SUBLINE}</p>
    </div>
  );
}

export { PAGE_CHARACTERS };
