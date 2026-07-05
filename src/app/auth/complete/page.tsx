'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { HANAKAI_POST_AUTH_PROFILE_PATH } from '@/lib/connection/auth-redirect';

const RETRY_MS = 400;
const MAX_RETRY = 15;

export default function AuthCompletePage() {
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      const supabase = createClient();

      for (let attempt = 1; attempt <= MAX_RETRY; attempt += 1) {
        const response = await fetch('/auth/complete/session', { cache: 'no-store', credentials: 'include' });
        const payload = response.ok ? await response.json() : null;
        const serverHasSession = Boolean(payload?.hasSession);
        const serverHasUser = Boolean(payload?.hasUser);
        let clientHasSession = false;
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          clientHasSession = Boolean(data.session);
        }

        console.log('AUTH_COMPLETE_SESSION_CHECK', {
          attempt,
          serverHasSession,
          serverHasUser,
          clientHasSession,
        });

        if (cancelled || redirected.current) return;

        if ((serverHasSession && serverHasUser) || clientHasSession) {
          redirected.current = true;
          router.replace(HANAKAI_POST_AUTH_PROFILE_PATH);
          return;
        }

        if (attempt < MAX_RETRY) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
        }
      }

      if (!cancelled && !redirected.current) {
        redirected.current = true;
        router.replace('/register?error=session_not_found');
      }
    }

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className='min-h-screen bg-[#fafaf8] px-4 py-8'>
      <div className='mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[420px] items-center'>
        <section className='w-full rounded-2xl border border-[#ebe9e4] bg-white p-6 text-center sm:p-7'>
          <p className='text-sm font-medium text-[#1a1a1a]'>認証を確認しています…</p>
          <p className='mt-2 text-xs text-[#6b6b6b]'>プロフィール入力画面へ移動します</p>
        </section>
      </div>
    </main>
  );
}
