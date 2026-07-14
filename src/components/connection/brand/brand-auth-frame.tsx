'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrandCharacterSlot } from '@/components/connection/brand/brand-character-slot';
import { BrandLogo } from '@/components/connection/brand/brand-logo';
import { BrandTagline } from '@/components/connection/brand/brand-scene';
import { BgTypography } from '@/components/connection/brand/bg-typography';
import { GlassSurface } from '@/components/connection/brand/glass-surface';
import { BrandReveal } from '@/components/connection/brand/brand-motion';
import { LegalLinks } from '@/components/connection/legal-links';
import type { BrandCharacterId } from '@/lib/connection/brand/characters';

type Props = {
  children: ReactNode;
  title: string;
  subtitle: string;
  characterId?: BrandCharacterId;
};

/** ログイン・新規登録用ブランドフレーム */
export function BrandAuthFrame({ children, title, subtitle, characterId = 'E1' }: Props) {
  return (
    <main className='relative min-h-screen overflow-hidden hk-vibrant-gradient px-5 py-10'>
      <BgTypography text='華会' />
      <BrandCharacterSlot
        id={characterId}
        size='lg'
        variant='peek'
        wrapperClassName='absolute -left-6 bottom-[12%] z-[1] opacity-90'
      />
      <BrandCharacterSlot
        id='S'
        size='sm'
        variant='float'
        wrapperClassName='absolute -right-4 top-[18%] z-[1] opacity-70'
      />

      <div className='relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[440px] flex-col items-center justify-center'>
        <BrandReveal className='mb-8 text-center'>
          <BrandLogo href='/' size='large' className='justify-center' />
          <div className='mt-4'>
            <BrandTagline />
          </div>
        </BrandReveal>

        <BrandReveal delay={0.1} className='w-full'>
          <GlassSurface className='w-full shadow-[0_20px_60px_rgba(31,93,79,0.08)]'>
            <h1 className='text-center text-2xl font-semibold tracking-tight text-[#1a1a1a]'>{title}</h1>
            <p className='mb-6 mt-2 text-center text-sm text-[#6b6b6b]'>{subtitle}</p>
            {children}
          </GlassSurface>
        </BrandReveal>
      </div>
    </main>
  );
}

export function BrandAuthLinks({ register = false }: { register?: boolean }) {
  return (
    <div className='mt-5'>
      <LegalLinks className='text-[#9a9a9a]' />
      <div className='mt-3 flex flex-col items-center gap-2 text-xs'>
        {register ? (
          <Link href='/login' className='font-medium text-[#1f5d4f] underline underline-offset-2'>
            すでにアカウントをお持ちの方はログインへ
          </Link>
        ) : (
          <>
            <Link href='/register' className='font-medium text-[#1f5d4f] underline underline-offset-2'>
              はじめての方は新規登録へ
            </Link>
            <Link href='/admin/login' className='font-medium text-[#9a9a9a] underline underline-offset-2'>
              管理者ログイン
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
