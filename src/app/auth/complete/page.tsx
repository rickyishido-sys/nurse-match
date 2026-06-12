'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const RETRY_MS = 500;
const MAX_RETRY = 10;

export default function AuthCompletePage() {
  const router = useRouter();

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
        let clientError: string | null = null;
        if (supabase) {
          const { data, error } = await supabase.auth.getSession();
          clientHasSession = Boolean(data.session);
          clientError = error?.message ?? null;
        }
        console.log('AUTH_COMPLETE_SESSION_CHECK', {
          attempt,
          serverHasSession,
          serverHasUser,
          clientHasSession,
          clientError,
        });
        if (cancelled) return;
        if ((serverHasSession && serverHasUser) || clientHasSession) {
          router.replace('/register/details');
          return;
        }
        if (attempt < MAX_RETRY) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
        }
      }

      if (!cancelled) {
        router.replace('/register?error=session_not_found');
      }
    }

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className='min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff_0%,_#fdf2f8_45%,_#ffffff_100%)] px-4 py-8'>
      <div className='mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[420px] items-center'>
        <section className='w-full rounded-[32px] border border-sky-100/80 bg-white/95 p-6 text-center shadow-[0_16px_45px_-35px_rgba(15,23,42,0.3)] backdrop-blur-sm sm:p-7'>
          <p className='text-sm font-medium text-slate-700'>認証を確認しています…</p>
        </section>
      </div>
    </main>
  );
}
