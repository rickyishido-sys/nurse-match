'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const BASE = '/admin/hanakai';

const items = [
  { href: BASE, label: 'ダッシュボード', exact: true },
  { href: `${BASE}/members`, label: '会員' },
  { href: `${BASE}/events`, label: 'イベント' },
  { href: `${BASE}/applications`, label: '参加申請' },
  { href: `${BASE}/revenue-reports`, label: '売上報告' },
  { href: `${BASE}/invoices`, label: '請求管理' },
  { href: `${BASE}/reports`, label: '通報管理' },
  { href: `${BASE}/inquiries`, label: 'お問い合わせ' },
  { href: '/manage', label: '参加者選定' },
];

export function HanakaiAdminNav() {
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
