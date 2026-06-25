'use client';

import type { ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { ChoiceCard, Chip, ONB, StepHeading } from './onboarding-ui';
import type { Option } from '@/lib/connection/onboarding-options';

const inputClass =
  'w-full rounded-2xl border bg-white px-5 py-4 text-base outline-none transition focus:border-current';

/** 抽象的で上質なブランドビジュアル（花・会話・コーヒー・散歩・つながりを連想）。 */
function BrandVisual() {
  const float = (delay: number, amount = 8, duration = 6) => ({
    animate: { y: [0, -amount, 0] },
    transition: { duration, repeat: Infinity, ease: 'easeInOut' as const, delay },
  });

  return (
    <div
      className='relative mt-4 h-60 w-full overflow-hidden rounded-[28px]'
      style={{
        background:
          'radial-gradient(120% 90% at 78% 18%, #f3ede1 0%, #efe9dd 38%, #e9efe9 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      }}
    >
      {/* 大きな有機的グラデーション円（つながり） */}
      <motion.div
        className='absolute -left-10 top-10 h-40 w-40 rounded-full'
        style={{ background: 'linear-gradient(150deg, #2f7163, #1f5d4f)', filter: 'blur(0.2px)' }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 0.92, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      <motion.div
        className='absolute -left-10 top-10 h-40 w-40 rounded-full'
        {...float(0.4, 6, 7)}
      >
        <span className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl opacity-90'>🌿</span>
      </motion.div>

      {/* ベージュのガラスカード（会話・余白） */}
      <motion.div
        className='absolute right-6 top-8 h-24 w-32 rounded-2xl border'
        style={{
          borderColor: 'rgba(255,255,255,0.7)',
          background: 'rgba(255,255,255,0.55)',
          boxShadow: '0 12px 30px rgba(31,36,33,0.10)',
          backdropFilter: 'blur(2px)',
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
      >
        <div className='flex h-full flex-col justify-center gap-1.5 px-4'>
          <span className='h-1.5 w-14 rounded-full' style={{ backgroundColor: '#cdb58c' }} />
          <span className='h-1.5 w-20 rounded-full' style={{ backgroundColor: '#e0d6c4' }} />
          <span className='h-1.5 w-10 rounded-full' style={{ backgroundColor: '#cdb58c' }} />
        </div>
      </motion.div>

      {/* 小さなティール円（コーヒー） */}
      <motion.div
        className='absolute bottom-7 right-16 flex h-16 w-16 items-center justify-center rounded-full'
        style={{ background: 'linear-gradient(140deg, #d8c7a6, #c9b48c)' }}
        {...float(0.2, 7, 6.5)}
      >
        <span className='text-lg'>☕</span>
      </motion.div>

      {/* ベージュのリング（散歩・循環） */}
      <motion.div
        className='absolute bottom-6 left-12 h-20 w-20 rounded-full border-[6px]'
        style={{ borderColor: 'rgba(31,93,79,0.16)' }}
        {...float(0.6, 5, 7.5)}
      />

      {/* 小さな点（花のつぼみ） */}
      <motion.span
        className='absolute left-28 top-12 h-3 w-3 rounded-full'
        style={{ backgroundColor: '#1f5d4f' }}
        {...float(0.1, 6, 5.5)}
      />
      <motion.span
        className='absolute right-28 bottom-20 h-2.5 w-2.5 rounded-full'
        style={{ backgroundColor: '#cdb58c' }}
        {...float(0.5, 6, 6)}
      />
    </div>
  );
}

/** 0. Welcome画面。ブランド体験としてのビジュアル領域つき。 */
export function OnboardingStepIntro() {
  return (
    <motion.div
      className='flex flex-1 flex-col'
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <BrandVisual />

      <div className='mt-9'>
        <h1
          className='font-serif text-[28px] leading-[1.4] font-semibold tracking-tight'
          style={{ color: ONB.ink }}
        >
          HANAKAI Connection
          <br />
          へようこそ
        </h1>
        <p className='mt-5 text-[15px] leading-8' style={{ color: ONB.subtle }}>
          HANAKAIは、プロフィールだけで人を判断するサービスではありません。
          一緒に過ごす体験を通じて、あなたに合うConnectionを運営が丁寧に設計します。
        </p>
        <div
          className='mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs'
          style={{ borderColor: ONB.border, color: ONB.subtle }}
        >
          <span>⏱</span>
          <span>この登録は約3分で完了します</span>
        </div>
      </div>
    </motion.div>
  );
}

/** 単一選択（大きなカード）。 */
export function SingleChoiceStep<T extends string>({
  index,
  title,
  subtitle,
  options,
  value,
  onChange,
}: {
  index: number;
  title: string;
  subtitle?: string;
  options: Option<T>[];
  value: T | '';
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <StepHeading index={index} title={title} subtitle={subtitle} />
      <div className='mt-7 grid gap-2.5'>
        {options.map((opt) => (
          <ChoiceCard key={opt.value} active={value === opt.value} onClick={() => onChange(opt.value)}>
            {opt.label}
          </ChoiceCard>
        ))}
      </div>
    </div>
  );
}

/** 複数選択（チップ or カード）。 */
export function MultiChoiceStep<T extends string>({
  index,
  title,
  subtitle,
  options,
  values,
  onToggle,
  variant = 'chip',
  max,
}: {
  index: number;
  title: string;
  subtitle?: string;
  options: Option<T>[];
  values: T[];
  onToggle: (value: T) => void;
  variant?: 'chip' | 'card';
  max?: number;
}) {
  const atMax = typeof max === 'number' && values.length >= max;
  return (
    <div>
      <StepHeading index={index} title={title} subtitle={subtitle} />
      {variant === 'chip' ? (
        <div className='mt-7 flex flex-wrap gap-2.5'>
          {options.map((opt) => (
            <Chip
              key={opt.value}
              active={values.includes(opt.value)}
              onClick={() => onToggle(opt.value)}
              disabled={atMax}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      ) : (
        <div className='mt-7 grid gap-2.5'>
          {options.map((opt) => (
            <ChoiceCard
              key={opt.value}
              active={values.includes(opt.value)}
              onClick={() => onToggle(opt.value)}
            >
              {opt.label}
            </ChoiceCard>
          ))}
        </div>
      )}
    </div>
  );
}

/** テキスト1行入力。 */
export function TextInputStep({
  index,
  title,
  subtitle,
  value,
  onChange,
  placeholder,
  inputMode,
  suffix,
  maxLength,
}: {
  index: number;
  title: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: 'text' | 'numeric';
  suffix?: string;
  maxLength?: number;
}) {
  function handle(e: ChangeEvent<HTMLInputElement>) {
    const next = inputMode === 'numeric' ? e.target.value.replace(/[^0-9]/g, '') : e.target.value;
    onChange(next);
  }
  return (
    <div>
      <StepHeading index={index} title={title} subtitle={subtitle} />
      <div className='mt-8 flex items-center gap-3'>
        <input
          value={value}
          onChange={handle}
          placeholder={placeholder}
          inputMode={inputMode === 'numeric' ? 'numeric' : 'text'}
          maxLength={maxLength}
          autoComplete='off'
          className={inputClass}
          style={{ borderColor: ONB.border, color: ONB.ink }}
        />
        {suffix ? (
          <span className='shrink-0 text-base' style={{ color: ONB.subtle }}>
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** 都道府県セレクト。横スクロールを避けるためネイティブselectを使用。 */
export function AreaSelectStep({
  index,
  title,
  subtitle,
  value,
  onChange,
  options,
}: {
  index: number;
  title: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <div>
      <StepHeading index={index} title={title} subtitle={subtitle} />
      <div className='mt-8'>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} appearance-none`}
          style={{ borderColor: ONB.border, color: value ? ONB.ink : ONB.subtle }}
        >
          <option value=''>選択してください</option>
          {options.map((pref) => (
            <option key={pref} value={pref}>
              {pref}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/** 自由記述（任意）。質問ごとの例文を下部に表示。 */
export function TextareaStep({
  index,
  title,
  subtitle,
  value,
  onChange,
  placeholder,
  examples,
}: {
  index: number;
  title: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  examples?: string[];
}) {
  return (
    <div>
      <StepHeading index={index} title={title} subtitle={subtitle} />
      <div className='mt-7'>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
          className={`${inputClass} resize-none leading-7`}
          style={{ borderColor: ONB.border, color: ONB.ink }}
        />

        {examples && examples.length > 0 ? (
          <div
            className='mt-4 rounded-2xl border px-4 py-3.5'
            style={{ borderColor: ONB.border, backgroundColor: '#ffffff' }}
          >
            <p className='text-[11px] font-medium tracking-[0.12em]' style={{ color: ONB.accent }}>
              例えば
            </p>
            <ul className='mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5'>
              {examples.map((ex) => (
                <li key={ex} className='flex items-center gap-1.5 text-[13px]' style={{ color: ONB.subtle }}>
                  <span style={{ color: '#cdb58c' }}>・</span>
                  {ex}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className='mt-3 text-xs' style={{ color: ONB.subtle }}>
          答えられるものだけで大丈夫です。スキップもできます。
        </p>
      </div>
    </div>
  );
}
