'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';

export const ONB = {
  bgOuter: '#ece6da',
  bgInner: '#fbf9f5',
  ink: '#1f2421',
  subtle: '#6f6b63',
  border: '#e7e2d8',
  accent: '#1f5d4f',
  accentSoft: '#edf3f0',
  accentBorder: '#1f5d4f',
  /** トップページと共通のゴールド（キッカー用）。 */
  gold: '#b8956a',
};

/** イラストごとの、やわらかい水彩トーンの背景グラデーション。 */
const ART_TONE: Record<string, string> = {
  '/flow/register.png': 'radial-gradient(circle at 50% 36%, #eef3ef 0%, #e7efe8 72%)',
  '/flow/apply.png': 'radial-gradient(circle at 50% 36%, #f3efe6 0%, #ece5d6 72%)',
  '/flow/matching.png': 'radial-gradient(circle at 50% 36%, #f1eef6 0%, #e7e3ef 72%)',
  '/flow/continue.png': 'radial-gradient(circle at 50% 36%, #eef3ef 0%, #e6ede6 72%)',
  '/categories/flower.png': 'radial-gradient(circle at 50% 36%, #f8eef0 0%, #f0e2e4 72%)',
  '/categories/cafe.png': 'radial-gradient(circle at 50% 36%, #f4ede2 0%, #ebddc9 72%)',
  '/categories/bar.png': 'radial-gradient(circle at 50% 36%, #f2ecf2 0%, #e8dde8 72%)',
  '/categories/fitness.png': 'radial-gradient(circle at 50% 36%, #eaf3ee 0%, #dfeee4 72%)',
  '/categories/stroll.png': 'radial-gradient(circle at 50% 36%, #eef3e9 0%, #e4ecdd 72%)',
};

/** 各ステップ上部の水彩イラスト。やわらかなタイルに乗せて上質感を出す。 */
export function StepArt({ src }: { src: string }) {
  const background = ART_TONE[src] ?? 'radial-gradient(circle at 50% 36%, #f3ede1 0%, #eef2ee 72%)';
  return (
    <motion.div
      className='relative mb-5 flex h-[88px] w-[88px] items-center justify-center rounded-[26px]'
      style={{ background, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)' }}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className='relative h-[60px] w-[60px]'>
        <Image src={src} alt='' fill sizes='60px' className='object-contain' />
      </div>
    </motion.div>
  );
}

const SOFT_SPRING = { type: 'spring' as const, stiffness: 520, damping: 32, mass: 0.7 };

/** 上部中央の進捗ドット。現在位置のみ強調し、滑らかに伸縮する。 */
export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className='flex items-center justify-center gap-1.5'>
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <motion.span
            key={i}
            className='h-1.5 rounded-full'
            initial={false}
            animate={{
              width: active ? 22 : 6,
              backgroundColor: done || active ? ONB.accent : '#ded7c8',
              opacity: done ? 0.5 : 1,
            }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          />
        );
      })}
    </div>
  );
}

/** スマホ幅カードの土台。PCでは中央に配置。100dvh前提でキーボードでも崩れない。 */
export function OnboardingLayout({
  header,
  footer,
  children,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className='flex min-h-[100dvh] w-full justify-center' style={{ backgroundColor: ONB.bgOuter }}>
      <div
        className='flex min-h-[100dvh] w-full max-w-[480px] flex-col lg:border-x'
        style={{ backgroundColor: ONB.bgInner, borderColor: ONB.border }}
      >
        {header ? (
          <header className='shrink-0 px-6 pt-[calc(18px+var(--safe-top))] pb-4'>{header}</header>
        ) : null}
        <main className='flex flex-1 flex-col overflow-x-hidden overflow-y-auto px-6 pb-8'>{children}</main>
        {footer ? (
          <footer
            className='shrink-0 border-t px-6 pt-4 pb-[calc(20px+var(--safe-bottom))] backdrop-blur-md'
            style={{ borderColor: ONB.border, backgroundColor: 'rgba(251,249,245,0.82)' }}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

/** 大きなタイトル + 補足。各画面の上部に置く。水彩イラスト（art）を伴う。 */
export function StepHeading({
  index,
  title,
  subtitle,
  art,
}: {
  index?: number;
  title: string;
  subtitle?: string;
  art?: string;
}) {
  return (
    <div className='pt-9'>
      {art ? <StepArt src={art} /> : null}
      {typeof index === 'number' ? (
        <p className='mb-2.5 text-[11px] font-semibold tracking-[0.2em]' style={{ color: ONB.gold }}>
          {String(index).padStart(2, '0')}
        </p>
      ) : null}
      <h1
        className='font-sans text-[25px] leading-[1.42] font-semibold tracking-tight'
        style={{ color: ONB.ink }}
      >
        {title}
      </h1>
      {subtitle ? (
        <p className='mt-3 text-sm leading-7' style={{ color: ONB.subtle }}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

/** 下部固定の戻る/次へボタン。 */
export function BottomNavButtons({
  onBack,
  onNext,
  nextLabel = '次へ',
  nextDisabled = false,
  nextType = 'button',
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextType?: 'button' | 'submit';
}) {
  return (
    <div className='flex items-center gap-3'>
      {onBack ? (
        <motion.button
          type='button'
          onClick={onBack}
          whileTap={{ scale: 0.96 }}
          transition={SOFT_SPRING}
          className='flex shrink-0 items-center justify-center rounded-full border px-6 text-sm font-medium'
          style={{ height: 52, borderColor: ONB.border, color: ONB.subtle }}
        >
          戻る
        </motion.button>
      ) : null}
      <motion.button
        type={nextType}
        onClick={nextType === 'submit' ? undefined : onNext}
        disabled={nextDisabled}
        whileTap={{ scale: nextDisabled ? 1 : 0.98 }}
        transition={SOFT_SPRING}
        className='flex flex-1 items-center justify-center rounded-full text-sm font-semibold text-white disabled:opacity-35'
        style={{ height: 52, backgroundColor: ONB.accent }}
      >
        {nextLabel}
      </motion.button>
    </div>
  );
}

/** 大きめのカード型選択肢（単一/複数共通）。選択時に静かな達成感を与える。 */
export function ChoiceCard({
  active,
  onClick,
  children,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <motion.button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      whileTap={{ scale: 0.985 }}
      initial={false}
      animate={{
        borderColor: active ? ONB.accentBorder : ONB.border,
        backgroundColor: active ? ONB.accentSoft : '#ffffff',
        boxShadow: active
          ? '0 8px 22px rgba(31,93,79,0.13)'
          : '0 1px 2px rgba(31,36,33,0.04)',
      }}
      transition={SOFT_SPRING}
      className='flex w-full items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left'
    >
      <span className='min-w-0'>
        <span className='block text-[15px] font-medium' style={{ color: ONB.ink }}>
          {children}
        </span>
        {hint ? (
          <span className='mt-0.5 block text-xs' style={{ color: ONB.subtle }}>
            {hint}
          </span>
        ) : null}
      </span>
      <span
        className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] text-white'
        style={{
          borderColor: active ? ONB.accent : '#d6d0c4',
          backgroundColor: active ? ONB.accent : 'transparent',
          transition: 'background-color 180ms ease, border-color 180ms ease',
        }}
      >
        <AnimatePresence initial={false}>
          {active ? (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 22 }}
            >
              ✓
            </motion.span>
          ) : null}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

/** 丸みのあるチップ（複数選択向け）。 */
export function Chip({
  active,
  onClick,
  children,
  disabled = false,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type='button'
      onClick={onClick}
      disabled={disabled && !active}
      aria-pressed={active}
      whileTap={{ scale: disabled && !active ? 1 : 0.94 }}
      initial={false}
      animate={{
        borderColor: active ? ONB.accentBorder : ONB.border,
        backgroundColor: active ? ONB.accent : '#ffffff',
        color: active ? '#ffffff' : ONB.ink,
        boxShadow: active ? '0 5px 14px rgba(31,93,79,0.16)' : '0 0px 0px rgba(0,0,0,0)',
      }}
      transition={SOFT_SPRING}
      className='rounded-full border px-4 py-2.5 text-sm disabled:opacity-40'
    >
      {children}
    </motion.button>
  );
}
