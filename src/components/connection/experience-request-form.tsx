'use client';

import { useState } from 'react';
import { submitExperienceRequestAction } from '@/lib/connection/experience-request-actions';
import {
  EXPERIENCE_REQUEST_AGE_GROUPS,
  EXPERIENCE_REQUEST_CATEGORIES,
  EXPERIENCE_REQUEST_DAYS,
  EXPERIENCE_REQUEST_PREFECTURES,
} from '@/lib/connection/experience-request-constants';
import { ctaPrimaryFull } from '@/components/connection/ui/cta-classes';

function ChipToggle({
  name,
  value,
  label,
  selected,
  onToggle,
}: {
  name: string;
  value: string;
  label: string;
  selected: boolean;
  onToggle: (value: string) => void;
}) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center rounded-full border px-3 py-2 text-xs font-semibold transition hover:scale-[1.02] active:scale-[0.98] ${
        selected
          ? 'border-[#1f5d4f] bg-[#1f5d4f] text-white shadow-sm'
          : 'border-[#d8d6d1] bg-white text-[#4a4a4a] hover:border-[#1f5d4f]/40'
      }`}
    >
      <input
        type='checkbox'
        name={name}
        value={value}
        checked={selected}
        onChange={() => onToggle(value)}
        className='sr-only'
      />
      {label}
    </label>
  );
}

export function ExperienceRequestForm() {
  const [categories, setCategories] = useState<string[]>([]);
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  const toggle = (list: string[], value: string, setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  return (
    <form
      action={async (formData) => {
        setPending(true);
        try {
          await submitExperienceRequestAction(formData);
        } finally {
          setPending(false);
        }
      }}
      className='space-y-8'
    >
      <fieldset className='space-y-3'>
        <legend className='text-sm font-semibold text-[#1a1a1a]'>カテゴリー（複数選択可）</legend>
        <div className='flex flex-wrap gap-2'>
          {EXPERIENCE_REQUEST_CATEGORIES.map((cat) => (
            <ChipToggle
              key={cat}
              name='category'
              value={cat}
              label={cat}
              selected={categories.includes(cat)}
              onToggle={(v) => toggle(categories, v, setCategories)}
            />
          ))}
        </div>
      </fieldset>

      <div className='grid gap-4 sm:grid-cols-2'>
        <label className='block space-y-2'>
          <span className='text-sm font-semibold text-[#1a1a1a]'>都道府県</span>
          <select
            name='prefecture'
            required
            className='h-12 w-full rounded-2xl border border-[#e8e4dc] bg-white px-4 text-sm outline-none transition focus:border-[#1f5d4f]'
            defaultValue=''
          >
            <option value='' disabled>
              選択してください
            </option>
            {EXPERIENCE_REQUEST_PREFECTURES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className='block space-y-2'>
          <span className='text-sm font-semibold text-[#1a1a1a]'>市区町村</span>
          <input
            name='city'
            required
            placeholder='例：横浜市西区'
            className='h-12 w-full rounded-2xl border border-[#e8e4dc] bg-white px-4 text-sm outline-none transition focus:border-[#1f5d4f]'
          />
        </label>
      </div>

      <fieldset className='space-y-3'>
        <legend className='text-sm font-semibold text-[#1a1a1a]'>希望曜日（複数選択可）</legend>
        <div className='flex flex-wrap gap-2'>
          {EXPERIENCE_REQUEST_DAYS.map((day) => (
            <ChipToggle
              key={day}
              name='preferred_day'
              value={day}
              label={day}
              selected={preferredDays.includes(day)}
              onToggle={(v) => toggle(preferredDays, v, setPreferredDays)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className='space-y-3'>
        <legend className='text-sm font-semibold text-[#1a1a1a]'>年代</legend>
        <div className='flex flex-wrap gap-2'>
          {EXPERIENCE_REQUEST_AGE_GROUPS.map((age) => (
            <label
              key={age}
              className='inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#d8d6d1] bg-white px-4 py-2 text-xs font-semibold transition has-[:checked]:border-[#1f5d4f] has-[:checked]:bg-[#f3f7f5] has-[:checked]:text-[#1f5d4f] hover:border-[#1f5d4f]/40'
            >
              <input type='radio' name='age_group' value={age} required className='accent-[#1f5d4f]' />
              {age}
            </label>
          ))}
        </div>
      </fieldset>

      <label className='block space-y-2'>
        <span className='text-sm font-semibold text-[#1a1a1a]'>どんな体験をしてみたいですか？</span>
        <textarea
          name='comment'
          rows={5}
          placeholder='自由にご記入ください'
          className='w-full rounded-2xl border border-[#e8e4dc] bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-[#1f5d4f]'
        />
      </label>

      <button type='submit' disabled={pending} className={ctaPrimaryFull}>
        {pending ? '送信中…' : '体験リクエストを送る'}
      </button>
    </form>
  );
}
