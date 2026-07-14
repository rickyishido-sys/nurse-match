import { NextResponse } from 'next/server';
import { guardDebugApi } from '@/lib/connection/production-guard';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TABLES = [
  'users',
  'female_profiles',
  'male_profiles',
  'identity_documents',
  'likes',
  'matches',
  'messages',
  'swipes',
  'datefi_interests',
] as const;

type TableCheckResult = {
  exists: boolean;
  count: number | null;
  error: string | null;
};

function isAdminRole(role: string | null | undefined) {
  return role === 'female_admin' || role === 'male_admin' || role === 'super_admin';
}

export async function GET() {
  const blocked = guardDebugApi();
  if (blocked) return blocked;

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, reason: 'missing_session_client' }, { status: 500 });
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }
  const { data: me } = await supabase.from('users').select('role').eq('id', authUser.id).maybeSingle();
  if (!me || !isAdminRole(me.role)) {
    return NextResponse.json({ ok: false, reason: 'forbidden' }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'missing_service_role_client',
      },
      { status: 500 },
    );
  }

  const entries = await Promise.all(
    TABLES.map(async (tableName) => {
      const { count, error } = await admin.from(tableName).select('id', { count: 'exact', head: true });
      const exists = error?.code === '42P01' ? false : true;
      const result: TableCheckResult = {
        exists,
        count: count ?? (error ? null : 0),
        error: error ? (error.message || error.code || 'unknown_error') : null,
      };
      return [tableName, result] as const;
    }),
  );

  return NextResponse.json({
    ok: true,
    checks: Object.fromEntries(entries),
  });
}

