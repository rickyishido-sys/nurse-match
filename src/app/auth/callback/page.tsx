'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HANAKAI_POST_AUTH_PROFILE_PATH } from '@/lib/connection/auth-redirect';

const PROFILE_PATH = HANAKAI_POST_AUTH_PROFILE_PATH;
const FALLBACK_MS = 10_000;

function parseHashTokens(hash: string) {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(raw);
  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
  };
}

export default function AuthCallbackPage() {
  const started = useRef(false);
  const redirected = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackPending, setFallbackPending] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    function redirectToProfile(reason: string) {
      if (redirected.current) return;
      redirected.current = true;
      window.history.replaceState(null, '', PROFILE_PATH);
      console.log('AUTH_CALLBACK_REDIRECT_PROFILE', { reason });
      window.location.replace(PROFILE_PATH);
    }

    const fallbackTimer = window.setTimeout(() => {
      if (redirected.current) return;
      setFallbackPending(true);
      redirectToProfile('fallback_timeout');
    }, FALLBACK_MS);

    async function run() {
      const { search, hash } = window.location;
      const query = new URLSearchParams(search);

      if (query.get('code') || query.get('token_hash')) {
        redirected.current = true;
        window.clearTimeout(fallbackTimer);
        window.location.replace(`/api/auth/callback${search}`);
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        console.error('AUTH_CALLBACK_SET_SESSION_ERROR', { message: 'missing_supabase_client' });
        setError('認証設定の読み込みに失敗しました。時間をおいて再度お試しください。');
        return;
      }

      const hasHashTokens = hash.includes('access_token') || hash.includes('refresh_token');

      if (!hasHashTokens) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          window.clearTimeout(fallbackTimer);
          redirectToProfile('existing_session');
          return;
        }
        console.error('AUTH_CALLBACK_SET_SESSION_ERROR', { message: 'hash_not_found' });
        setError('認証情報が見つかりませんでした。メールのリンクをもう一度開いてください。');
        return;
      }

      console.log('AUTH_CALLBACK_HASH_FOUND', {
        hasAccessToken: hash.includes('access_token'),
        hasRefreshToken: hash.includes('refresh_token'),
      });

      const { access_token, refresh_token } = parseHashTokens(hash);
      if (!access_token || !refresh_token) {
        console.error('AUTH_CALLBACK_SET_SESSION_ERROR', {
          message: 'missing_tokens_in_hash',
          hasAccessToken: Boolean(access_token),
          hasRefreshToken: Boolean(refresh_token),
        });
        setError('認証トークンの読み取りに失敗しました。メールのリンクをもう一度開いてください。');
        return;
      }

      console.log('AUTH_CALLBACK_SET_SESSION_START');
      const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });

      if (sessionError) {
        console.error('AUTH_CALLBACK_SET_SESSION_ERROR', { message: sessionError.message });
        setError('セッションの確立に失敗しました。メールのリンクをもう一度開いてください。');
        return;
      }

      console.log('AUTH_CALLBACK_SET_SESSION_SUCCESS');
      window.clearTimeout(fallbackTimer);
      redirectToProfile('set_session_success');
    }

    void run();

    return () => window.clearTimeout(fallbackTimer);
  }, []);

  return (
    <main className='min-h-screen bg-[#fafaf8] px-5 py-8'>
      <div className='mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[420px] items-center'>
        <section className='w-full rounded-2xl border border-[#ebe9e4] bg-white p-6 text-center sm:p-7'>
          <div className='mb-4 flex flex-col items-center'>
            <span className='text-[15px] font-semibold tracking-[0.12em] text-[#1a1a1a]'>HANAKAI</span>
            <span className='text-[11px] font-medium tracking-[0.2em] text-[#6b6b6b]'>CONNECTION</span>
          </div>

          {error ? (
            <>
              <p className='text-sm font-medium text-[#1a1a1a]'>認証の確認に問題が発生しました</p>
              <div className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700'>
                {error}
              </div>
              <p className='mt-4 text-xs text-[#6b6b6b]'>
                {fallbackPending
                  ? 'プロフィール入力画面へ移動しています…'
                  : '10秒以内にプロフィール入力画面へ移動します。'}
              </p>
              <Link
                href={PROFILE_PATH}
                className='mt-4 inline-block text-xs font-medium text-[#1f5d4f] underline underline-offset-2'
              >
                プロフィール入力へ進む
              </Link>
            </>
          ) : (
            <>
              <p className='text-sm font-medium text-[#1a1a1a]'>認証を確認しています…</p>
              <p className='mt-2 text-xs text-[#6b6b6b]'>プロフィール入力画面へ移動します</p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
