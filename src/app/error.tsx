'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { BrandCharacterSlot } from '@/components/connection/brand/brand-character-slot';
import { BrandLogo } from '@/components/connection/brand/brand-logo';
import { BgTypography } from '@/components/connection/brand/bg-typography';
import { GlassSurface } from '@/components/connection/brand/glass-surface';
import { ctaPrimary, ctaSecondary } from '@/components/connection/ui/cta-classes';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('GLOBAL_ERROR', { message: error.message, digest: error.digest ?? null });
  }, [error]);

  return (
    <div className='relative min-h-screen overflow-hidden bg-[#faf7f2] text-[#1a1a1a]'>
      <BgTypography text='華会' />
      <header className='relative z-10 border-b border-white/40 bg-white/70 px-5 py-4 backdrop-blur-xl'>
        <BrandLogo href='/' size='md' />
      </header>
      <main className='relative flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-5 py-10 text-center'>
        <BrandCharacterSlot id='D1' size='lg' variant='float' wrapperClassName='absolute right-[8%] top-[25%]' />
        <GlassSurface className='relative z-10 max-w-md text-center'>
          <h1 className='font-serif text-lg font-semibold tracking-tight'>問題が発生しました</h1>
          <p className='mx-auto mt-3 text-sm leading-7 text-[#6b6b6b]'>
            ページの読み込み中にエラーが発生しました。しばらくしてからもう一度お試しください。
          </p>
          <div className='mt-8 flex flex-col items-center gap-3'>
            <button type='button' onClick={() => reset()} className={`hk-brand-btn ${ctaPrimary}`}>
              もう一度試す
            </button>
            <Link href='/' className={ctaSecondary}>
              トップへ戻る
            </Link>
          </div>
        </GlassSurface>
      </main>
    </div>
  );
}
