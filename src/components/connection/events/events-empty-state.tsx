'use client';

import Link from 'next/link';
import { BrandCharacter } from '@/components/connection/brand/brand-character';
import { BrandReveal } from '@/components/connection/brand/brand-motion';
import { BgTypography } from '@/components/connection/brand/bg-typography';
import { GlassSurface } from '@/components/connection/brand/glass-surface';
import { ctaPrimary } from '@/components/connection/ui/cta-classes';

export function EventsEmptyState() {
  return (
    <div className='relative overflow-hidden py-8'>
      <BgTypography text='華会' />
      <div className='pointer-events-none absolute -right-2 top-8'>
        <BrandCharacter id='N' size='xl' variant='peek' />
      </div>
      <BrandReveal>
        <GlassSurface className='relative mx-auto max-w-lg text-center'>
          <h2 className='font-serif text-lg font-semibold text-[#1a1a1a]'>
            現在、新しい体験を準備しています。
          </h2>
          <p className='mx-auto mt-3 max-w-md text-sm leading-8 text-[#6b6b6b]'>
            花やコーヒー、散歩など——あなたに合う体験をひとつずつ整えています。
            公開まで、もう少しお待ちください。
          </p>
          <Link href='/contact?category=event' className={`mt-8 ${ctaPrimary}`}>
            イベント開催を希望する
          </Link>
        </GlassSurface>
      </BrandReveal>
    </div>
  );
}
