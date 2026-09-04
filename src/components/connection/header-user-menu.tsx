'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { logoutAction } from '@/lib/actions';
import type { HanakaiUserRole } from '@/lib/hanakai/session';
import { getRoleDisplayLabel, getRoleToneClass } from '@/lib/hanakai/user-role';

export type HeaderUserMenuUser = {
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  role: HanakaiUserRole;
};

type HeaderUserMenuProps = {
  user: HeaderUserMenuUser;
};

function UserAvatar({ name, avatarUrl, size = 32 }: { name: string; avatarUrl: string | null; size?: number }) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=''
        width={size}
        height={size}
        className='rounded-full object-cover'
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className='flex shrink-0 items-center justify-center rounded-full bg-[#eef4f1] text-sm'
      style={{ width: size, height: size }}
      aria-hidden
    >
      👤
    </span>
  );
}

export function HeaderUserMenu({ user }: HeaderUserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const roleLabel = getRoleDisplayLabel(user.role);
  const roleTone = getRoleToneClass(user.role);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <div ref={rootRef} className='relative'>
      <button
        type='button'
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup='menu'
        className='flex max-w-[10.5rem] items-center gap-2 rounded-2xl border border-[#e8e5df] bg-white px-2 py-1.5 text-left shadow-sm transition hover:border-[#d8d6d1] sm:max-w-[260px] sm:gap-2.5 sm:px-2.5 sm:py-2'
      >
        <UserAvatar name={user.displayName} avatarUrl={user.avatarUrl} />
        <span className='min-w-0 flex-1'>
          <span className='block truncate text-xs font-semibold text-[#1a1a1a]'>{user.displayName}</span>
          {user.email ? (
            <span className='hidden truncate text-[10px] text-[#8a8a8a] sm:block'>{user.email}</span>
          ) : null}
          <span className={`mt-0.5 hidden text-[10px] font-medium sm:block ${roleTone}`}>{roleLabel}</span>
        </span>
        <span className='shrink-0 text-[10px] text-[#9a9a9a]' aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div
          role='menu'
          className='absolute right-0 z-30 mt-2 w-[220px] overflow-hidden rounded-2xl border border-[#ebe9e4] bg-white shadow-lg'
        >
          <div className='border-b border-[#f0eeea] px-4 py-3'>
            <div className='flex items-center gap-3'>
              <UserAvatar name={user.displayName} avatarUrl={user.avatarUrl} size={40} />
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold text-[#1a1a1a]'>{user.displayName}</p>
                {user.email ? <p className='truncate text-[11px] text-[#8a8a8a]'>{user.email}</p> : null}
                <p className={`mt-0.5 text-[11px] font-medium ${roleTone}`}>{roleLabel}</p>
              </div>
            </div>
          </div>

          <div className='py-1.5'>
            <Link
              href='/my-profile'
              role='menuitem'
              onClick={() => setOpen(false)}
              className='block px-4 py-2.5 text-sm text-[#1a1a1a] transition hover:bg-[#f7f6f3]'
            >
              プロフィール
            </Link>
            <Link
              href='/account/payment-methods'
              role='menuitem'
              onClick={() => setOpen(false)}
              className='block px-4 py-2.5 text-sm text-[#1a1a1a] transition hover:bg-[#f7f6f3]'
            >
              お支払い方法
            </Link>
            <Link
              href='/account/blocked'
              role='menuitem'
              onClick={() => setOpen(false)}
              className='block px-4 py-2.5 text-sm text-[#1a1a1a] transition hover:bg-[#f7f6f3]'
            >
              ブロック一覧
            </Link>
            <Link
              href='/account/delete'
              role='menuitem'
              onClick={() => setOpen(false)}
              className='block px-4 py-2.5 text-sm text-[#6b6b6b] transition hover:bg-[#f7f6f3]'
            >
              アカウント削除
            </Link>
            <form action={logoutAction}>
              <button
                type='submit'
                role='menuitem'
                className='block w-full px-4 py-2.5 text-left text-sm text-[#c0392b] transition hover:bg-[#fdf4f3]'
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
