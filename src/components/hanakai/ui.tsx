import Link from 'next/link';

export function SectionHeading({ title, action }: { title: string; action?: { href: string; label: string } }) {
  return (
    <div className='mb-2 flex items-center justify-between'>
      <h2 className='text-sm font-bold text-slate-800'>{title}</h2>
      {action ? (
        <Link href={action.href} className='text-xs font-semibold text-[#4f7a4a]'>
          {action.label} ›
        </Link>
      ) : null}
    </div>
  );
}

export function Chip({ children, tone = 'green' }: { children: React.ReactNode; tone?: 'green' | 'pink' | 'gold' | 'gray' }) {
  const tones: Record<string, string> = {
    green: 'bg-[#eef4ea] text-[#4f7a4a]',
    pink: 'bg-[#fbeef0] text-[#b56b7a]',
    gold: 'bg-[#f6efdf] text-[#9b7d3f]',
    gray: 'bg-slate-100 text-slate-500',
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{children}</span>;
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div className='h-2 w-full overflow-hidden rounded-full bg-[#eef0ec]'>
      <div className='h-full rounded-full bg-gradient-to-r from-[#7fae78] to-[#caa66a]' style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-[#eaeee6] bg-white p-4 shadow-[0_10px_30px_-24px_rgba(63,107,59,0.5)] ${className}`}>{children}</div>;
}
