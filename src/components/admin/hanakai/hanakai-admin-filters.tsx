'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

type AdminSearchBarProps = {
  paramKey?: string;
  placeholder?: string;
  defaultValue?: string;
};

export function AdminSearchBar({
  paramKey = 'q',
  placeholder = '検索…',
  defaultValue = '',
}: AdminSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [, startTransition] = useTransition();

  const submit = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = next.trim();
      if (trimmed) params.set(paramKey, trimmed);
      else params.delete(paramKey);
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [paramKey, router, searchParams],
  );

  return (
    <form
      className='flex gap-2'
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className='min-w-0 flex-1 rounded-xl border border-[#e2ddd2] bg-white px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#1f5d4f]'
      />
      <button
        type='submit'
        className='shrink-0 rounded-xl bg-[#1f5d4f] px-4 py-2 text-xs font-semibold text-white'
      >
        検索
      </button>
    </form>
  );
}

type FilterOption = { value: string; label: string };

type AdminSelectFilterProps = {
  paramKey: string;
  label: string;
  options: FilterOption[];
  defaultValue?: string;
};

export function AdminSelectFilter({ paramKey, label, options, defaultValue = 'all' }: AdminSelectFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const current = searchParams.get(paramKey) ?? defaultValue;

  return (
    <label className='flex flex-col gap-1 text-xs text-[#6b6b6b]'>
      <span>{label}</span>
      <select
        value={current}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          const v = e.target.value;
          if (!v || v === 'all') params.delete(paramKey);
          else params.set(paramKey, v);
          startTransition(() => router.push(`?${params.toString()}`));
        }}
        className='rounded-xl border border-[#e2ddd2] bg-white px-3 py-2 text-sm text-[#1a1a1a]'
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
