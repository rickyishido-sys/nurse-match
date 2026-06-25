'use client';

import type { ReactNode } from 'react';

export const ONB = {
  bgOuter: '#ece6da',
  bgInner: '#fbf9f5',
  ink: '#1f2421',
  subtle: '#6f6b63',
  border: '#e7e2d8',
  accent: '#1f5d4f',
  accentSoft: '#edf3f0',
  accentBorder: '#1f5d4f',
};

/** 上部の進捗ドット。現在位置を強調する。 */
export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className='flex items-center justify-center gap-1.5'>
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <span
            key={i}
            className='h-1.5 rounded-full transition-all duration-300'
            style={{
              width: active ? 20 : 6,
              backgroundColor: done || active ? ONB.accent : '#ded7c8',
              opacity: done ? 0.55 : 1,
            }}
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
        <main className='flex flex-1 flex-col overflow-y-auto px-6 pb-8'>{children}</main>
        {footer ? (
          <footer
            className='shrink-0 border-t px-6 pt-4 pb-[calc(20px+var(--safe-bottom))]'
            style={{ borderColor: ONB.border, backgroundColor: ONB.bgInner }}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

/** 大きなタイトル + 補足。各画面の上部に置く。 */
export function StepHeading({
  index,
  title,
  subtitle,
}: {
  index?: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className='pt-6'>
      {typeof index === 'number' ? (
        <p className='mb-3 text-[11px] font-medium tracking-[0.22em]' style={{ color: ONB.accent }}>
          {String(index).padStart(2, '0')}
        </p>
      ) : null}
      <h1
        className='font-serif text-[26px] leading-[1.4] font-semibold tracking-tight'
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
        <button
          type='button'
          onClick={onBack}
          className='flex h-13 shrink-0 items-center justify-center rounded-full border px-6 text-sm font-medium transition active:scale-[0.98]'
          style={{ height: 52, borderColor: ONB.border, color: ONB.subtle }}
        >
          戻る
        </button>
      ) : null}
      <button
        type={nextType}
        onClick={nextType === 'submit' ? undefined : onNext}
        disabled={nextDisabled}
        className='flex flex-1 items-center justify-center rounded-full text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-35'
        style={{ height: 52, backgroundColor: ONB.accent }}
      >
        {nextLabel}
      </button>
    </div>
  );
}

/** 大きめのカード型選択肢（単一/複数共通）。 */
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
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      className='flex w-full items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left transition active:scale-[0.99]'
      style={{
        borderColor: active ? ONB.accentBorder : ONB.border,
        backgroundColor: active ? ONB.accentSoft : '#ffffff',
        boxShadow: active ? `inset 0 0 0 1px ${ONB.accent}` : 'none',
      }}
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
        }}
      >
        {active ? '✓' : ''}
      </span>
    </button>
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
    <button
      type='button'
      onClick={onClick}
      disabled={disabled && !active}
      aria-pressed={active}
      className='rounded-full border px-4 py-2.5 text-sm transition active:scale-[0.97] disabled:opacity-40'
      style={{
        borderColor: active ? ONB.accentBorder : ONB.border,
        backgroundColor: active ? ONB.accent : '#ffffff',
        color: active ? '#ffffff' : ONB.ink,
      }}
    >
      {children}
    </button>
  );
}
