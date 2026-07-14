import type { ReactNode } from 'react';
import Link from 'next/link';
import { HK } from '@/lib/connection/brand/tokens';

type Props = {
  href: string;
  className?: string;
  variant?: 'solid' | 'outline';
  children?: ReactNode;
};

/** ブランドカラー + ホバーアニメーション付き新規登録 CTA */
export function RegisterCtaLink({
  href,
  className = '',
  variant = 'solid',
  children = '新規登録',
}: Props) {
  const base =
    'inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold transition duration-200 hover:scale-[1.03] active:scale-[0.97]';

  const styles =
    variant === 'solid'
      ? `text-white shadow-md hover:shadow-lg`
      : `border-2 border-[#1f5d4f]/30 text-[#1f5d4f] hover:bg-[#1f5d4f]/5`;

  return (
    <Link
      href={href}
      prefetch
      className={`${base} ${styles} ${className}`}
      style={variant === 'solid' ? { background: `linear-gradient(135deg, ${HK.coral} 0%, ${HK.coralSoft} 100%)` } : undefined}
    >
      {children}
    </Link>
  );
}
