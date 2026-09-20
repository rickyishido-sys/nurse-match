import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  classifyPasswordUpdateError,
  isSamePasswordError,
  validateHanakaiPassword,
} from '@/lib/connection/password-policy';

export async function POST(request: Request) {
  console.log('BLOOM_PASSWORD_UPDATE_START');
  let body: { password?: string; confirmPassword?: string };
  try {
    body = await request.json();
  } catch {
    console.error('BLOOM_PASSWORD_UPDATE_ERROR', { reason: 'invalid_json' });
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const password = String(body.password ?? '');
  const confirm = String(body.confirmPassword ?? '');
  const validation = validateHanakaiPassword(password, confirm);
  if (validation) {
    console.error('BLOOM_PASSWORD_UPDATE_ERROR', { reason: validation });
    return NextResponse.json({ error: validation }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    console.error('BLOOM_PASSWORD_UPDATE_ERROR', { reason: 'missing_supabase_client' });
    return NextResponse.json({ error: 'config' }, { status: 500 });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token && session.refresh_token) {
    const { error: hydrateError } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    if (hydrateError) {
      console.error('BLOOM_PASSWORD_UPDATE_ERROR', {
        reason: 'session_hydrate_failed',
        code: hydrateError.code ?? null,
        status: hydrateError.status ?? null,
      });
    }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('BLOOM_PASSWORD_UPDATE_ERROR', {
      reason: 'auth_user_missing',
      status: userError?.status ?? null,
      code: userError?.code ?? null,
    });
    return NextResponse.json({ error: 'auth' }, { status: 401 });
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError && !isSamePasswordError(updateError)) {
    const classified = classifyPasswordUpdateError(updateError);
    console.error('BLOOM_PASSWORD_UPDATE_ERROR', {
      reason: 'update_user_failed',
      classified,
      code: updateError.code ?? null,
      status: updateError.status ?? null,
      userId: user.id,
    });

    if (classified === 'auth') {
      const admin = createAdminSupabaseClient();
      if (admin) {
        const { error: adminError } = await admin.auth.admin.updateUserById(user.id, { password });
        if (adminError && !isSamePasswordError(adminError)) {
          const adminClassified = classifyPasswordUpdateError(adminError);
          console.error('BLOOM_PASSWORD_UPDATE_ERROR', {
            reason: 'admin_update_failed',
            classified: adminClassified,
            code: adminError.code ?? null,
            userId: user.id,
          });
          return NextResponse.json({ error: adminClassified }, { status: adminClassified === 'auth' ? 401 : 400 });
        }
      } else {
        return NextResponse.json({ error: 'auth' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: classified }, { status: 400 });
    }
  }

  const nextMetadata = {
    ...(user.user_metadata ?? {}),
    hanakai_password_set: true,
  };
  const { error: metaError } = await supabase.auth.updateUser({ data: nextMetadata });
  if (metaError) {
    const admin = createAdminSupabaseClient();
    if (admin) {
      const { error: adminMetaError } = await admin.auth.admin.updateUserById(user.id, {
        user_metadata: nextMetadata,
      });
      if (adminMetaError) {
        console.error('BLOOM_PASSWORD_UPDATE_ERROR', {
          reason: 'metadata_update_failed',
          code: adminMetaError.code ?? null,
          userId: user.id,
        });
      }
    }
  }

  console.log('BLOOM_PASSWORD_UPDATE_SUCCESS', { userId: user.id });
  return NextResponse.json({ ok: true });
}
