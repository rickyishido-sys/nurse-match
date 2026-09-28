'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/connection/brand/brand-logo';
import { ctaGhost, ctaPrimaryFull } from '@/components/connection/ui/cta-classes';

type Props = {
  onSignup: () => void;
  onLater: () => void;
};

export function LaunchOnboardingModal({ onSignup, onLater }: Props) {
  return (
    <div
      className='fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-6'
      role='dialog'
      aria-modal='true'
      aria-labelledby='launch-onboarding-title'
    >
      <button
        type='button'
        className='absolute inset-0 cursor-default'
        aria-label='閉じる'
        onClick={onLater}
      />
      <div
        className='relative flex max-h-[min(88dvh,40rem)] w-full max-w-[420px] flex-col overflow-hidden rounded-[1.75rem] border border-white/70 bg-[#faf7f2] shadow-[0_20px_48px_rgba(26,26,26,0.18)]'
        style={{
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className='mx-auto mt-3 h-1 w-10 rounded-full bg-[#d8d6d1] sm:hidden' aria-hidden />
        <div className='flex shrink-0 items-center justify-center px-5 pb-2 pt-4'>
          <BrandLogo href={null} size='sm' />
        </div>
        <div className='min-h-0 flex-1 overflow-y-auto px-5 pb-2 pt-1'>
          <h2
            id='launch-onboarding-title'
            className='font-serif text-[1.35rem] font-semibold leading-snug text-[#1a1a1a]'
          >
            HANAKAIは、いま始まったばかりです。🌱
          </h2>
          <div className='mt-4 space-y-4 text-sm leading-7 text-[#5a5247]'>
            <p>HANAKAIは現在、全国で少しずつ仲間を増やしている立ち上げ期です。</p>
            <p>
              まだイベントが少ない地域もありますが、
              あなたが登録してくれることで、新しいイベントや出会いが生まれやすくなっていきます。
            </p>
            <p>まずはHANAKAIに参加してみてください。</p>
            <p>
              そして、
              「こんなことを誰かとやってみたい」
              と思ったら、あなた自身でイベントを作ることもできます。
            </p>
            <p>花、カフェ、写真、スポーツ、音楽、ダーツ、勉強会……</p>
            <p>
              好きなことをきっかけに、
              人と出会う場所を一緒に増やしていきましょう。
            </p>
          </div>
        </div>
        <div className='shrink-0 space-y-3 border-t border-[#ebe9e4] bg-[#faf7f2] px-5 pt-4'>
          <Link href='/register' className={`${ctaPrimaryFull} hk-brand-btn`} onClick={onSignup}>
            HANAKAIに登録する
          </Link>
          <p className='text-center text-xs leading-5 text-[#6b6b6b]'>登録は無料です</p>
          <button type='button' className={`${ctaGhost} w-full`} onClick={onLater}>
            あとで見る
          </button>
        </div>
      </div>
    </div>
  );
}
