'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { HANAKAI_POST_AUTH_PROFILE_PATH } from '@/lib/connection/auth-redirect';

const PROFILE_PATH = HANAKAI_POST_AUTH_PROFILE_PATH;

/**
 * メール認証リンクの着地先（PKCE query / implicit hash 両対応）。
 * セッション確立後は必ず /register/profile へ。URL からトークンを除去する。
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const { search, hash } = window.location;
    const params = new URLSearchParams(search);

    if (params.get('code') || params.get('token_hash')) {
      window.location.replace(`/api/auth/callback${search}`);
      return;
    }

    const hasHashTokens =
      hash.includes('access_token') || hash.includes('refresh_token') || hash.includes('type=magiclink');

    if (!hasHashTokens) {
      router.replace('/register?error=auth-callback');
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      router.replace('/register?error=config');
      return;
    }

    function finish() {
      window.history.replaceState(null, '', PROFILE_PATH);
      router.replace(PROFILE_PATH);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        subscription.unsubscribe();
        finish();
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        finish();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <main className='min-h-screen bg-[#fafaf8] px-5 py-8'>
      <div className='mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[420px] items-center'>
        <section className='w-full rounded-2xl border border-[#ebe9e4] bg-white p-6 text-center sm:p-7'>
          <div className='mb-4 flex flex-col items-center'>
            <span className='text-[15px] font-semibold tracking-[0.12em] text-[#1a1a1a]'>HANAKAI</span>
            <span className='text-[11px] font-medium tracking-[0.2em] text-[#6b6b6b]'>CONNECTION</span>
          </div>
          <p className='text-sm font-medium text-[#1a1a1a]'>認証を確認しています…</p>
          <p className='mt-2 text-xs text-[#6b6b6b]'>プロフィール入力画面へ移動します</p>
        </section>
      </div>
    </main>
  );
}
