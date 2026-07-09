'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { CONNECTION_NAV_CLASS } from '@/lib/connection/layout-width';

const items = [
  { href: '/home', label: 'ホーム' },
  { href: '/events', label: 'イベント' },
  { href: '/connections', label: 'コミュニティ' },
  { href: '/my-profile', label: 'プロフィール' },
];

export function ConnectionBottomNav() {
  const pathname = usePathname();

  return (
    <nav className={`${CONNECTION_NAV_CLASS} !border-white/50 !bg-white/80 backdrop-blur-xl`}>
      <ul className='grid grid-cols-4 gap-1'>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  'flex min-h-11 items-center justify-center rounded-full py-2.5 text-[11px] font-medium transition',
                  active ? 'bg-[#1f5d4f] text-white shadow-sm' : 'text-[#6b6b6b] hover:text-[#1a1a1a]',
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
