'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { CONNECTION_NAV_CLASS } from '@/lib/connection/layout-width';

const items = [
  { href: '/home', label: 'ホーム' },
  { href: '/events', label: 'イベント' },
  { href: '/connections/ce6', label: 'Connection' },
  { href: '/register/profile', label: 'プロフィール' },
];

export function ConnectionBottomNav() {
  const pathname = usePathname();

  return (
    <nav className={CONNECTION_NAV_CLASS}>
      <ul className='grid grid-cols-4 gap-1'>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  'flex items-center justify-center rounded-full py-2.5 text-[11px] font-medium transition',
                  active ? 'bg-[#1a1a1a] text-white' : 'text-[#6b6b6b]',
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
