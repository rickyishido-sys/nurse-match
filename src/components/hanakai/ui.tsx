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

type CycleStep = {
  key: string;
  phase: string;
  icon: string;
  title: string;
  body: string;
};

// 「リアル → デジタル → リアル」の循環を一目で伝えるダイアグラム。
export function CycleDiagram({
  steps,
  variant = 'full',
}: {
  steps: readonly CycleStep[];
  variant?: 'full' | 'compact';
}) {
  return (
    <div className='rounded-3xl border border-[#e7ede3] bg-gradient-to-br from-[#f3f8ef] to-[#fbeef0] p-4'>
      <div className='mb-3 flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-wide text-[#4f7a4a]'>
        <span className='rounded-full bg-white/70 px-2 py-0.5'>リアル花会</span>
        <span className='text-[#caa66a]'>→</span>
        <span className='rounded-full bg-white/70 px-2 py-0.5'>デジタル</span>
        <span className='text-[#caa66a]'>→</span>
        <span className='rounded-full bg-white/70 px-2 py-0.5'>またリアル</span>
        <span className='ml-0.5 text-[#caa66a]'>↻</span>
      </div>
      <div className={variant === 'compact' ? 'grid grid-cols-3 gap-2' : 'space-y-2'}>
        {steps.map((step, idx) => (
          <div key={step.key}>
            <div
              className={
                variant === 'compact'
                  ? 'h-full rounded-2xl bg-white/80 p-3 text-center'
                  : 'flex items-start gap-3 rounded-2xl bg-white/80 p-3'
              }
            >
              <div
                className={
                  variant === 'compact'
                    ? 'mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef4ea] text-lg'
                    : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef4ea] text-xl'
                }
              >
                {step.icon}
              </div>
              <div className={variant === 'compact' ? '' : 'min-w-0'}>
                <p className='text-[10px] font-bold tracking-wider text-[#caa66a]'>{step.phase}</p>
                <p className={`font-bold text-slate-800 ${variant === 'compact' ? 'text-[11px] leading-4' : 'text-sm'}`}>{step.title}</p>
                {variant === 'full' ? <p className='mt-1 text-xs leading-6 text-slate-600'>{step.body}</p> : null}
              </div>
            </div>
            {variant === 'full' && idx < steps.length - 1 ? (
              <div className='py-1 text-center text-[#caa66a]'>↓</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

