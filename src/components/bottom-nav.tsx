'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

type BottomNavProps = {
  role?: 'user' | 'female_admin' | 'male_admin' | 'super_admin';
};

type NavItem = { href: string; label: string };

export function BottomNav({ role = 'user' }: BottomNavProps) {
  const pathname = usePathname();

  const userItems: NavItem[] = [
    { href: '/home', label: 'ホーム' },
    { href: '/favorites', label: 'お気に入り' },
    { href: '/matches', label: 'マッチ' },
    { href: '/profile/edit', label: 'プロフィール' },
  ];

  const adminItems: NavItem[] = [
    { href: '/admin', label: '審査' },
    { href: '/home', label: 'ホーム' },
    { href: '/community-guidelines', label: 'ガイド' },
  ];

  const isAdmin = role === 'female_admin' || role === 'male_admin' || role === 'super_admin';
  const items = isAdmin ? adminItems : userItems;

  return (
    <nav className='fixed bottom-0 left-1/2 z-30 w-full max-w-[390px] -translate-x-1/2 border-t border-slate-200 bg-white/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur'>
      <ul className={`grid gap-2 ${isAdmin ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  'flex h-10 items-center justify-center rounded-xl text-xs font-semibold',
                  active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600',
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
