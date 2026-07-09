import Link from 'next/link';
import { ctaPrimary, ctaSecondary } from '@/components/connection/ui/cta-classes';
import { HK } from '@/lib/connection/brand/tokens';

type Props = {
  className?: string;
  /** イベント一覧ページでは「見る」を控えめにする */
  variant?: 'default' | 'on-events-page';
};

export function EventsActionBar({ className = '', variant = 'default' }: Props) {
  const viewClass = variant === 'on-events-page' ? ctaSecondary : ctaPrimary;

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 ${className}`}>
      <Link href='/events' className={`${viewClass} flex-1 sm:min-w-[200px]`}>
        イベントを見る
      </Link>
      <Link
        href='/events/create'
        className='hk-brand-btn inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-6 text-sm font-semibold text-white transition hover:opacity-95 active:scale-[0.98] sm:min-w-[200px]'
        style={{ background: HK.coral }}
      >
        イベントを作る
      </Link>
    </div>
  );
}
