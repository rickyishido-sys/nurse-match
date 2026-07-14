import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  console.log('BLOOM_PASSWORD_UPDATE_START');
  let body: { password?: string; confirmPassword?: string };
  try {
    body = await request.json();
  } catch {
    console.error('BLOOM_PASSWORD_UPDATE_ERROR', { message: 'invalid_json' });
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const password = String(body.password ?? '');
  const confirm = String(body.confirmPassword ?? '');

  if (password.length < 8) {
    console.error('BLOOM_PASSWORD_UPDATE_ERROR', { message: 'password_too_short' });
    return NextResponse.json({ error: 'short' }, { status: 400 });
  }
  if (password !== confirm) {
    console.error('BLOOM_PASSWORD_UPDATE_ERROR', { message: 'password_mismatch' });
    return NextResponse.json({ error: 'mismatch' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    console.error('BLOOM_PASSWORD_UPDATE_ERROR', { message: 'missing_supabase_client' });
    return NextResponse.json({ error: 'config' }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error('BLOOM_PASSWORD_UPDATE_ERROR', { message: 'auth_user_missing' });
    return NextResponse.json({ error: 'auth' }, { status: 401 });
  }

  const { error } = await supabase.auth.updateUser({
    password,
    data: { hanakai_password_set: true },
  });

  if (error) {
    console.error('BLOOM_PASSWORD_UPDATE_ERROR', { message: error.message, userId: user.id });
    return NextResponse.json({ error: 'failed', detail: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
