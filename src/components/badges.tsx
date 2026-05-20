import clsx from 'clsx';
import type { ReactNode } from 'react';

type BadgeProps = {
  children: ReactNode;
  tone?: 'navy' | 'pink' | 'gray' | 'green' | 'amber';
};

export function Badge({ children, tone = 'gray' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide',
        tone === 'navy' && 'border-slate-800 bg-slate-900 text-white',
        tone === 'pink' && 'border-pink-200 bg-pink-50 text-pink-700',
        tone === 'green' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        tone === 'amber' && 'border-amber-200 bg-amber-50 text-amber-700',
        tone === 'gray' && 'border-slate-200 bg-slate-50 text-slate-700',
      )}
    >
      {children}
    </span>
  );
}
