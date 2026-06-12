import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, hasSession: false, hasUser: false, reason: 'missing_supabase_config' }, { status: 500 });
  }

  const [{ data: sessionData, error: sessionError }, { data: userData, error: userError }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.getUser(),
  ]);

  return NextResponse.json({
    ok: !sessionError && !userError,
    hasSession: Boolean(sessionData.session),
    hasUser: Boolean(userData.user),
    sessionError: sessionError?.message ?? null,
    userError: userError?.message ?? null,
  });
}
