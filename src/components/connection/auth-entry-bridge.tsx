'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const DEFAULT_NEXT = '/register/profile';

/**
 * Supabase メールリンクが Site URL (/) や任意パスに着地したとき、
 * /auth/callback 経由でセッション確立 → プロフィール入力へ送る。
 */
export function AuthEntryBridge() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const tokenHash = params.get('token_hash');
    const type = params.get('type');

    if (code || tokenHash) {
      const next = params.get('next') || DEFAULT_NEXT;
      const q = new URLSearchParams();
      if (code) q.set('code', code);
      if (tokenHash) q.set('token_hash', tokenHash);
      if (type) q.set('type', type);
      q.set('next', next.startsWith('/') ? next : DEFAULT_NEXT);
      router.replace(`/auth/callback?${q.toString()}`);
      return;
    }

    const hash = window.location.hash;
    if (!hash.includes('access_token')) return;

    const supabase = createClient();
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      if (pathname === '/' || pathname === '/register') {
        router.replace(DEFAULT_NEXT);
      }
    });
  }, [pathname, router]);

  return null;
}
