'use client';

import Image from 'next/image';
import { BrandCharacter } from '@/components/connection/brand/brand-character';
import { BrandReveal } from '@/components/connection/brand/brand-motion';
import { BgTypography } from '@/components/connection/brand/bg-typography';
import { GlassSurface } from '@/components/connection/brand/glass-surface';
import { BRAND_SUBLINE } from '@/lib/connection/brand/tokens';

export function EventsListHero() {
  return (
    <div className='relative min-h-[280px] overflow-visible sm:min-h-[320px]'>
      <BgTypography text='体験' className='!left-[20%] !top-[40%]' />

      {/* 重なる写真レイヤー */}
      <div className='pointer-events-none absolute right-0 top-0 z-[1] h-[200px] w-[55%] sm:h-[260px] sm:w-[48%]'>
        <div className='absolute right-0 top-4 h-[85%] w-[78%] rotate-2 overflow-hidden rounded-[1.5rem] shadow-[0_20px_50px_rgba(26,26,26,0.15)]'>
          <Image src='/hero/mobile/cafe.png' alt='' fill sizes='50vw' className='object-cover' />
          <div className='absolute inset-0 bg-gradient-to-t from-black/40 to-transparent' />
        </div>
        <div className='absolute -left-4 bottom-0 h-[65%] w-[55%] -rotate-3 overflow-hidden rounded-[1.25rem] border-4 border-white shadow-lg'>
          <Image src='/hero/mobile/flower.png' alt='' fill sizes='30vw' className='object-cover' />
        </div>
      </div>

      <div className='pointer-events-none absolute -left-2 bottom-6 z-[3] sm:bottom-10'>
        <BrandCharacter id='E2' size='lg' variant='peek' />
      </div>
      <div className='pointer-events-none absolute right-[8%] top-[55%] z-[3] hidden sm:block'>
        <BrandCharacter id='A' size='sm' variant='float' />
      </div>

      <BrandReveal className='relative z-[2] max-w-[58%] pt-4 sm:max-w-[52%] sm:pt-8'>
        <GlassSurface className='!bg-white/80'>
          <p className='text-[11px] font-semibold tracking-[0.28em] text-[#b8956a]'>華会</p>
          <h1 className='mt-2 font-serif text-[1.5rem] font-semibold leading-[1.35] tracking-tight text-[#1a1a1a] sm:text-[1.85rem]'>
            体験からはじまる、
            <br />
            新しい出会い
          </h1>
          <p className='mt-3 text-xs leading-[1.9] text-[#5a5247] sm:text-sm'>{BRAND_SUBLINE}</p>
        </GlassSurface>
      </BrandReveal>
    </div>
  );
}
