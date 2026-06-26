'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const BASE = '/admin/connection';

const items = [
  { href: BASE, label: 'ダッシュボード', exact: true },
  { href: `${BASE}/users`, label: 'ユーザー' },
  { href: `${BASE}/events`, label: 'イベント審査' },
  { href: `${BASE}/hosts`, label: 'Host申請' },
  { href: `${BASE}/connections`, label: 'Connection履歴' },
  { href: `${BASE}/reviews`, label: 'レビュー' },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className='-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0'>
      <ul className='flex gap-1.5'>
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  'inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition',
                  active
                    ? 'bg-[#1f5d4f] text-white'
                    : 'border border-[#e2ddd2] bg-white text-[#6b6b6b] hover:text-[#1a1a1a]',
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
