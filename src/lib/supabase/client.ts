import { createBrowserClient } from '@supabase/ssr';
import { HANAKAI_AUTH_COOKIE_OPTIONS } from '@/lib/supabase/auth-cookie-options';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  return createBrowserClient(url, anon, {
    cookieOptions: HANAKAI_AUTH_COOKIE_OPTIONS,
  });
}
