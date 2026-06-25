'use client';

import type { ChangeEvent } from 'react';
import { ChoiceCard, Chip, ONB, StepHeading } from './onboarding-ui';
import type { Option } from '@/lib/connection/onboarding-options';

const inputClass =
  'w-full rounded-2xl border bg-white px-5 py-4 text-base outline-none transition focus:border-current';

/** 0. Welcome画面。上品な円形モチーフのイラスト領域つき。 */
export function OnboardingStepIntro() {
  return (
    <div className='flex flex-1 flex-col'>
      <div className='relative mt-8 flex items-center justify-center'>
        <div className='relative h-44 w-44'>
          <span
            className='absolute inset-0 rounded-full'
            style={{ background: 'radial-gradient(circle at 35% 30%, #eef3f0, #e3ded3)' }}
          />
          <span
            className='absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full'
            style={{ background: 'linear-gradient(140deg, #2f7163, #1f5d4f)' }}
          />
          <span className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl'>🌿</span>
          <span
            className='absolute -right-1 top-6 h-10 w-10 rounded-full'
            style={{ backgroundColor: '#cdb58c', opacity: 0.85 }}
          />
          <span
            className='absolute -left-2 bottom-6 h-6 w-6 rounded-full'
            style={{ backgroundColor: '#dfd6c6' }}
          />
        </div>
      </div>

      <div className='mt-10'>
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
    </div>
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

/** 自由記述（任意）。 */
export function TextareaStep({
  index,
  title,
  subtitle,
  value,
  onChange,
  placeholder,
}: {
  index: number;
  title: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
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
        <p className='mt-3 text-xs' style={{ color: ONB.subtle }}>
          答えられるものだけで大丈夫です。スキップもできます。
        </p>
      </div>
    </div>
  );
}
