import Link from 'next/link';

export function SectionHeading({ title, action }: { title: string; action?: { href: string; label: string } }) {
  return (
    <div className='mb-3 flex items-end justify-between'>
      <h2 className='text-sm font-semibold tracking-wide text-[#1a1a1a]'>{title}</h2>
      {action ? (
        <Link href={action.href} className='text-xs font-medium text-[#6b6b6b] underline-offset-2 hover:underline'>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function Chip({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'accent' | 'muted' }) {
  const tones = {
    neutral: 'bg-[#f0eeea] text-[#1a1a1a]',
    accent: 'bg-[#1a1a1a] text-white',
    muted: 'bg-[#f5f4f2] text-[#6b6b6b]',
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{children}</span>;
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#ebe9e4] bg-white p-5 ${className}`}>{children}</div>
  );
}

export function PrimaryButton({ children, className = '', ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      className={`h-12 w-full rounded-full bg-[#1a1a1a] text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, href, className = '' }: { children: React.ReactNode; href: string; className?: string }) {
  return (
    <Link
      href={href}
      className={`flex h-12 w-full items-center justify-center rounded-full border border-[#1a1a1a] bg-transparent text-sm font-semibold text-[#1a1a1a] transition active:scale-[0.98] ${className}`}
    >
      {children}
    </Link>
  );
}
