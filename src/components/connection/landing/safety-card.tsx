import { LP_GOLD } from '@/components/connection/landing/landing-ui';

function ShieldIcon() {
  return (
    <svg viewBox='0 0 24 24' className='h-7 w-7 shrink-0' fill='none' aria-hidden>
      <path
        d='M12 2L4 5.5V11.5C4 16.5 7.5 20.5 12 22C16.5 20.5 20 16.5 20 11.5V5.5L12 2Z'
        stroke={LP_GOLD}
        strokeWidth='1.5'
        fill={`${LP_GOLD}15`}
      />
      <path d='M9 12L11 14L15 10' stroke={LP_GOLD} strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  );
}

function TrustBadge({ icon, label }: { icon: 'identity' | 'verified'; label: string }) {
  return (
    <div className='flex items-center gap-2.5 rounded-xl border border-[#ebe5dc]/80 bg-white/90 px-3.5 py-2.5'>
      <div
        className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full'
        style={{ backgroundColor: `${LP_GOLD}18` }}
      >
        {icon === 'identity' ? (
          <svg viewBox='0 0 20 20' className='h-3.5 w-3.5' fill={LP_GOLD} aria-hidden>
            <path d='M10 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm-5.5 7a5.5 5.5 0 0111 0H4.5z' />
          </svg>
        ) : (
          <svg viewBox='0 0 20 20' className='h-3.5 w-3.5' fill={LP_GOLD} aria-hidden>
            <path d='M10 1.5L3 4.5v5.5c0 4 3 7.5 7 9 4-1.5 7-5 7-9V4.5L10 1.5zm-1 10.5L6 9l1.2-1.2L9 9.6l3.8-3.8L14 7l-5 5z' />
          </svg>
        )}
      </div>
      <span className='text-xs font-medium text-[#1a1a1a]'>{label}</span>
    </div>
  );
}

export function LandingSafetyCard() {
  return (
    <section className='rounded-2xl bg-[#f3ebe0]/80 px-5 py-7'>
      <div className='space-y-5'>
        <div className='flex gap-3'>
          <ShieldIcon />
          <div>
            <h2 className='font-serif text-base font-semibold text-[#1a1a1a]'>安心して参加できる環境を</h2>
            <p className='mt-2.5 text-xs leading-6 text-[#5a5247]'>
              HANAKAIでは、本人確認に加え、運営による安全確認を実施しています。
              安心して出会い、より深いConnectionを築ける場を提供します。
            </p>
          </div>
        </div>

        <div className='grid gap-2.5'>
          <TrustBadge icon='identity' label='本人確認済み' />
          <TrustBadge icon='verified' label='運営確認済み' />
        </div>
      </div>
    </section>
  );
}
