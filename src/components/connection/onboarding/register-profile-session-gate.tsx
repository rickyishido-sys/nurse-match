'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BrandLogo } from '@/components/connection/brand/brand-logo';
import { createClient } from '@/lib/supabase/client';

type Props = {
  children?: React.ReactNode;
  hasServerUser: boolean;
};

const MAX_ATTEMPTS = 12;
const RETRY_MS = 300;

export function RegisterProfileSessionGate({ children, hasServerUser }: Props) {
  const [state, setState] = useState<'ready' | 'syncing' | 'unauthenticated'>(hasServerUser ? 'ready' : 'syncing');

  useEffect(() => {
    if (hasServerUser) return;

    let cancelled = false;

    async function syncSession() {
      const supabase = createClient();
      if (!supabase) {
        if (!cancelled) setState('unauthenticated');
        return;
      }

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          window.location.reload();
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, RETRY_MS));
      }

      if (!cancelled) setState('unauthenticated');
    }

    void syncSession();
    return () => {
      cancelled = true;
    };
  }, [hasServerUser]);

  useEffect(() => {
    if (state !== 'unauthenticated') return;
    window.location.replace('/register?error=session_not_found');
  }, [state]);

  if (state === 'ready') return <>{children}</>;

  if (state === 'syncing') {
    return (
      <main className='flex min-h-[60vh] flex-col items-center justify-center px-5'>
        <BrandLogo href='/' size='md' className='mb-8' />
        <section className='w-full max-w-[420px] rounded-2xl border border-[#ebe9e4] bg-white p-6 text-center'>
          <p className='text-sm font-medium text-[#1a1a1a]'>認証を確認しています…</p>
          <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>プロフィール入力画面を準備しています。</p>
        </section>
      </main>
    );
  }

  return (
    <main className='flex min-h-[60vh] flex-col items-center justify-center px-5'>
      <BrandLogo href='/' size='md' className='mb-8' />
      <section className='w-full max-w-[420px] rounded-2xl border border-[#ebe9e4] bg-white p-6 text-center'>
        <p className='text-sm font-medium text-[#1a1a1a]'>認証セッションの確認に時間がかかっています</p>
        <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>
          メールの認証リンクをもう一度開くか、登録画面からやり直してください。
        </p>
        <Link href='/register' className='mt-4 inline-block text-xs font-semibold text-[#1f5d4f] underline-offset-2 hover:underline'>
          登録画面へ戻る
        </Link>
      </section>
    </main>
  );
}
