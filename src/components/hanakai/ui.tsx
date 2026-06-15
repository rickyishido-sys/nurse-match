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

// 投げ花のティアをタップして応援する（モック）。amount を form submit する。
export function ThrowFlowerMenu({
  tiers,
  hiddenFields,
  action,
  payoutPct = 80,
}: {
  tiers: { id: string; label: string; amount: number; emoji: string; note: string }[];
  hiddenFields: Record<string, string>;
  action: (formData: FormData) => void | Promise<void>;
  payoutPct?: number;
}) {
  return (
    <div>
      <div className='grid grid-cols-2 gap-2'>
        {tiers.map((tier) => (
          <form key={tier.id} action={action}>
            {Object.entries(hiddenFields).map(([name, value]) => (
              <input key={name} type='hidden' name={name} value={value} />
            ))}
            <input type='hidden' name='amount' value={tier.amount} />
            <input type='hidden' name='tier' value={tier.id} />
            <button
              type='submit'
              className='flex w-full flex-col items-start gap-0.5 rounded-2xl border border-[#e0d4b6] bg-white p-3 text-left transition active:scale-[0.98]'
            >
              <span className='text-lg'>{tier.emoji}</span>
              <span className='text-xs font-bold text-slate-800'>{tier.label}</span>
              <span className='text-sm font-bold text-[#9b7d3f]'>¥{tier.amount.toLocaleString('ja-JP')}</span>
              <span className='text-[10px] leading-4 text-slate-500'>{tier.note}</span>
            </button>
          </form>
        ))}
      </div>
      <p className='mt-2 text-[11px] leading-5 text-slate-500'>
        見た目や人気ではなく、夢・挑戦・活動への共感で応援する設計です。応援の約{payoutPct}%が本人に届きます（決済は準備中のモックです）。
      </p>
    </div>
  );
}
