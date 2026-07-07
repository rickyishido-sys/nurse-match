'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { motion } from 'motion/react';
import { clearOnboardingProgress } from '@/lib/connection/onboarding-progress';
import { ONB } from './onboarding-ui';

function SuccessMark() {
  return (
    <div className='relative flex items-center justify-center'>
      <motion.span
        className='absolute rounded-full'
        style={{ width: 96, height: 96, border: '1px solid rgba(31,93,79,0.35)' }}
        initial={{ scale: 0.9, opacity: 0.5 }}
        animate={{ scale: 1.7, opacity: 0 }}
        transition={{ duration: 1.3, ease: 'easeOut', delay: 0.2 }}
      />
      <motion.div
        className='flex items-center justify-center rounded-full'
        style={{ width: 88, height: 88, background: 'linear-gradient(140deg, #2f7163, #1f5d4f)' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      >
        <svg width='40' height='40' viewBox='0 0 24 24' fill='none' aria-hidden>
          <motion.path
            d='M5 12.5 L10 17.5 L19 7'
            stroke='#ffffff'
            strokeWidth={2.4}
            strokeLinecap='round'
            strokeLinejoin='round'
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.28, duration: 0.5, ease: 'easeOut' }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' as const, delay },
});

export function CompletionView({
  nickname,
  personality,
}: {
  nickname?: string;
  personality?: { label: string; description: string } | null;
}) {
  useEffect(() => {
    clearOnboardingProgress();
  }, []);

  return (
    <div className='flex min-h-[100dvh] w-full justify-center' style={{ backgroundColor: ONB.bgOuter }}>
      <div
        className='flex min-h-[100dvh] w-full max-w-[480px] flex-col px-6 pt-[calc(28px+var(--safe-top))] pb-[calc(28px+var(--safe-bottom))] lg:border-x'
        style={{ backgroundColor: ONB.bgInner, borderColor: ONB.border }}
      >
        <div className='flex flex-1 flex-col items-center justify-center text-center'>
          <SuccessMark />

          <motion.h1
            className='mt-8 font-sans text-[24px] font-semibold tracking-tight'
            style={{ color: ONB.ink }}
            {...fadeUp(0.45)}
          >
            登録ありがとうございます
          </motion.h1>

          <motion.p className='mt-5 text-[15px] leading-8' style={{ color: ONB.subtle }} {...fadeUp(0.55)}>
            {nickname ? `${nickname}さん、` : ''}Bloom Profile の基本情報を保存しました。
            <br />
            体験やConnectionを通じて、あなたらしいプロフィールが少しずつ育っていきます。
          </motion.p>

          <motion.p className='mt-4 text-sm leading-7' style={{ color: ONB.subtle }} {...fadeUp(0.65)}>
            SNSや性格タイプは、あとからいつでも追加・編集できます。
          </motion.p>

          {personality ? (
            <motion.div
              className='mt-7 w-full rounded-2xl border px-5 py-4'
              style={{ borderColor: ONB.border, backgroundColor: '#ffffff' }}
              {...fadeUp(0.75)}
            >
              <p className='text-[11px] font-medium tracking-[0.2em]' style={{ color: ONB.accent }}>
                あなたのConnectionタイプ
              </p>
              <p className='mt-1.5 text-lg font-semibold' style={{ color: ONB.ink }}>
                {personality.label}
              </p>
              <p className='mt-1 text-xs leading-6' style={{ color: ONB.subtle }}>
                {personality.description}
              </p>
            </motion.div>
          ) : null}
        </div>

        <motion.div className='mt-8 grid gap-3' {...fadeUp(0.85)}>
          <Link
            href='/home'
            className='flex h-13 items-center justify-center rounded-full text-sm font-semibold text-white transition active:scale-[0.99]'
            style={{ height: 52, backgroundColor: ONB.accent }}
          >
            ホームへ
          </Link>
          <Link
            href='/events'
            className='flex items-center justify-center rounded-full border text-sm font-medium transition active:scale-[0.99]'
            style={{ height: 52, borderColor: ONB.border, color: ONB.subtle }}
          >
            イベントを見る
          </Link>
          <Link
            href='/my-profile'
            className='flex items-center justify-center rounded-full border text-sm font-medium transition active:scale-[0.99]'
            style={{ height: 52, borderColor: ONB.border, color: ONB.subtle }}
          >
            プロフィールを確認する
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
