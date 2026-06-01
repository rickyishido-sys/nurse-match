import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

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

export async function GET() {
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
      const { count, error } = await admin.from(tableName).select('*', { count: 'exact', head: true });
      const result: TableCheckResult = {
        exists: !error,
        count: error ? null : count ?? 0,
        error: error?.message ?? null,
      };
      return [tableName, result] as const;
    }),
  );

  return NextResponse.json({
    ok: true,
    checks: Object.fromEntries(entries),
  });
}

