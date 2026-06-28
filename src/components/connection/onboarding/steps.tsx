'use client';

import type { ChangeEvent } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ChoiceCard, Chip, ONB, StepHeading } from './onboarding-ui';
import type { Option } from '@/lib/connection/onboarding-options';

const inputClass =
  'w-full rounded-2xl border bg-white px-5 py-[18px] text-base leading-relaxed outline-none transition focus:border-current';

/** トップページと同じ水彩イラストを使ったブランドビジュアル。 */
const WELCOME_ART = [
  { src: '/categories/flower.png', tone: 'radial-gradient(circle at 50% 38%, #f8eef0 0%, #f0e2e4 74%)' },
  { src: '/categories/cafe.png', tone: 'radial-gradient(circle at 50% 38%, #f4ede2 0%, #ebddc9 74%)' },
  { src: '/categories/stroll.png', tone: 'radial-gradient(circle at 50% 38%, #eef3e9 0%, #e4ecdd 74%)' },
] as const;

function BrandVisual() {
  return (
    <div className='mt-2 flex items-end justify-center gap-3'>
      {WELCOME_ART.map((art, i) => (
        <motion.div
          key={art.src}
          className={`relative flex items-center justify-center rounded-[28px] ${
            i === 1 ? 'h-[124px] w-[124px]' : 'h-[100px] w-[100px]'
          }`}
          style={{ background: art.tone, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)' }}
          initial={{ opacity: 0, y: 14, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.08 * i }}
        >
          <div className={`relative ${i === 1 ? 'h-[84px] w-[84px]' : 'h-[68px] w-[68px]'}`}>
            <Image src={art.src} alt='' fill sizes='84px' className='object-contain' priority={i === 1} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/** 0. Welcome画面。ブランド体験としてのビジュアル領域つき。 */
export function OnboardingStepIntro() {
  return (
    <motion.div
      className='flex flex-1 flex-col pt-4'
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <BrandVisual />

      <div className='mt-10'>
        <p className='mb-2.5 text-[11px] font-semibold tracking-[0.2em]' style={{ color: ONB.gold }}>
          WELCOME
        </p>
        <h1
          className='font-sans text-[27px] leading-[1.4] font-semibold tracking-tight'
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
  art,
}: {
  index: number;
  title: string;
  subtitle?: string;
  options: Option<T>[];
  value: T | '';
  onChange: (value: T) => void;
  art?: string;
}) {
  return (
    <div>
      <StepHeading index={index} title={title} subtitle={subtitle} art={art} />
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
  art,
}: {
  index: number;
  title: string;
  subtitle?: string;
  options: Option<T>[];
  values: T[];
  onToggle: (value: T) => void;
  variant?: 'chip' | 'card';
  max?: number;
  art?: string;
}) {
  const atMax = typeof max === 'number' && values.length >= max;
  return (
    <div>
      <StepHeading index={index} title={title} subtitle={subtitle} art={art} />
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
  art,
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
  art?: string;
}) {
  function handle(e: ChangeEvent<HTMLInputElement>) {
    const next = inputMode === 'numeric' ? e.target.value.replace(/[^0-9]/g, '') : e.target.value;
    onChange(next);
  }
  return (
    <div>
      <StepHeading index={index} title={title} subtitle={subtitle} art={art} />
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
  art,
}: {
  index: number;
  title: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  art?: string;
}) {
  return (
    <div>
      <StepHeading index={index} title={title} subtitle={subtitle} art={art} />
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
  art,
}: {
  index: number;
  title: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  examples?: string[];
  art?: string;
}) {
  return (
    <div>
      <StepHeading index={index} title={title} subtitle={subtitle} art={art} />
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
