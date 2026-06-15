'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

type NavItem = { href: string; label: string; icon: string };

const items: NavItem[] = [
  { href: '/home', label: 'ホーム', icon: '🏠' },
  { href: '/events', label: '花会', icon: '🗓️' },
  { href: '/posts', label: '投稿', icon: '🌸' },
  { href: '/support', label: '応援', icon: '💛' },
  { href: '/lives', label: 'ライブ', icon: '📺' },
  { href: '/members', label: '仲間', icon: '👥' },
];

export function HanakaiBottomNav() {
  const pathname = usePathname();

  return (
    <nav className='fixed bottom-0 left-1/2 z-30 w-full max-w-[420px] -translate-x-1/2 border-t border-[#e3ece0] bg-white/95 px-2 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur'>
      <ul className='grid grid-cols-6 gap-0.5'>
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  'flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-semibold transition',
                  active ? 'bg-[#eef4ea] text-[#4f7a4a]' : 'text-slate-500',
                )}
              >
                <span className='text-base leading-none'>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
