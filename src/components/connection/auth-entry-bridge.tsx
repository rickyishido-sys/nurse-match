'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { HANAKAI_POST_AUTH_PROFILE_PATH } from '@/lib/connection/auth-redirect';

const PROFILE_PATH = HANAKAI_POST_AUTH_PROFILE_PATH;
const BRIDGE_PATHS = new Set(['/', '/register', '/register/continue', '/auth/complete']);

/**
 * Supabase メールリンクが Site URL (/) や hash (#access_token) で着地した場合、
 * セッション確立後に必ず /register/profile へ送る。
 */
export function AuthEntryBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const tokenHash = params.get('token_hash');
    const type = params.get('type');

    if (code || tokenHash) {
      redirected.current = true;
      const q = new URLSearchParams();
      if (code) q.set('code', code);
      if (tokenHash) q.set('token_hash', tokenHash);
      if (type) q.set('type', type);
      q.set('next', PROFILE_PATH);
      router.replace(`/auth/callback?${q.toString()}`);
      return;
    }

    const hash = window.location.hash;
    const hasImplicitTokens =
      hash.includes('access_token') || hash.includes('refresh_token') || hash.includes('type=magiclink');

    const supabase = createClient();
    if (!supabase) return;

    function goProfile() {
      if (redirected.current) return;
      redirected.current = true;
      if (hasImplicitTokens) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      router.replace(PROFILE_PATH);
    }

    if (hasImplicitTokens) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          subscription.unsubscribe();
          goProfile();
        }
      });

      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          subscription.unsubscribe();
          goProfile();
        }
      });

      return () => subscription.unsubscribe();
    }

    if (!pathname || !BRIDGE_PATHS.has(pathname)) return;

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || redirected.current) return;
      if (pathname === PROFILE_PATH) return;
      goProfile();
    });
  }, [pathname, router]);

  return null;
}
