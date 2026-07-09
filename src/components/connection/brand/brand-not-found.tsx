'use client';

import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { BrandCharacter } from '@/components/connection/brand/brand-character';
import { BrandReveal } from '@/components/connection/brand/brand-motion';
import { BgTypography } from '@/components/connection/brand/bg-typography';
import { GlassSurface } from '@/components/connection/brand/glass-surface';
import { ctaPrimary } from '@/components/connection/ui/cta-classes';
import type { HanakaiViewer } from '@/lib/hanakai/session';

type Props = {
  viewer: HanakaiViewer | null;
};

export function BrandNotFoundContent({ viewer }: Props) {
  return (
    <ConnectionShell viewer={viewer} showNav={false}>
      <div className='relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden py-12 text-center'>
        <BgTypography text='404' />
        <div className='pointer-events-none absolute -left-4 top-[20%]'>
          <BrandCharacter id='S' size='xl' variant='peek' />
        </div>

        <BrandReveal className='relative z-10 max-w-md'>
          <GlassSurface className='text-center'>
            <p className='text-[11px] font-semibold tracking-[0.28em] text-[#b8956a]'>華会</p>
            <h1 className='mt-3 font-serif text-xl font-semibold tracking-tight text-[#1a1a1a]'>
              ページが見つかりませんでした
            </h1>
            <p className='mx-auto mt-3 text-sm leading-7 text-[#6b6b6b]'>
              リンクが古いか、ページが移動・削除された可能性があります。
            </p>
            <div className='mt-7 flex flex-col items-center gap-3'>
              <Link href='/' className={ctaPrimary}>
                トップへ戻る
              </Link>
              <Link
                href='/events'
                className='text-xs font-semibold text-[#8b7355] underline-offset-2 hover:underline'
              >
                イベント一覧を見る
              </Link>
            </div>
          </GlassSurface>
        </BrandReveal>
      </div>
    </ConnectionShell>
  );
}
