import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { HANAKAI_AUTH_COOKIE_OPTIONS } from '@/lib/supabase/auth-cookie-options';

export async function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const cookieStore = await cookies();

  return createServerClient(url, anon, {
    cookieOptions: HANAKAI_AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // In Server Actions / Route Handlers this persists auth cookies.
        // In Server Components cookie mutation can fail, so ignore safely.
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, { ...options, path: '/' });
          });
        } catch {
          // no-op for read-only cookie contexts
        }
      },
    },
  });
}
