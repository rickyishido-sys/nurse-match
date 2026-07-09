import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { Badge } from '@/components/badges';
import manifest from '@/app/manifest';
import { STORAGE_BUCKETS, USE_MOCK_DATA } from '@/lib/config';
import { getCurrentUser } from '@/lib/data';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata = {
  robots: { index: false, follow: false },
};

type CheckResult = {
  label: string;
  ok: boolean;
  detail: string;
};

async function checkTableConnectivity(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  table: 'users' | 'daily_recommendations' | 'favorites' | 'profile_images' | 'risk_checks',
): Promise<CheckResult> {
  if (USE_MOCK_DATA) {
    return { label: `${table} テーブル疎通`, ok: true, detail: 'mock=true のためチェックをスキップ' };
  }
  if (!admin) {
    return { label: `${table} テーブル疎通`, ok: false, detail: 'SUPABASE_SERVICE_ROLE_KEY が未設定です' };
  }
  const { error, count } = await admin.from(table).select('id', { count: 'exact', head: true });
  if (error) {
    return { label: `${table} テーブル疎通`, ok: false, detail: error.message };
  }
  return { label: `${table} テーブル疎通`, ok: true, detail: `OK (count=${count ?? 0})` };
}

async function checkStorageBuckets(admin: ReturnType<typeof createAdminSupabaseClient>) {
  const bucketIds = [STORAGE_BUCKETS.profile, STORAGE_BUCKETS.identity, STORAGE_BUCKETS.nurse];

  if (USE_MOCK_DATA) {
    return bucketIds.map((id) => ({
      label: `Storage bucket: ${id}`,
      ok: true,
      detail: 'mock=true のためチェックをスキップ',
    }));
  }
  if (!admin) {
    return bucketIds.map((id) => ({
      label: `Storage bucket: ${id}`,
      ok: false,
      detail: 'SUPABASE_SERVICE_ROLE_KEY が未設定です',
    }));
  }

  const { data, error } = await admin.from('storage.buckets').select('id').in('id', bucketIds);
  if (error) {
    return bucketIds.map((id) => ({
      label: `Storage bucket: ${id}`,
      ok: false,
      detail: error.message,
    }));
  }
  const existing = new Set((data ?? []).map((row) => row.id));
  return bucketIds.map((id) => ({
    label: `Storage bucket: ${id}`,
    ok: existing.has(id),
    detail: existing.has(id) ? '存在を確認' : '未作成',
  }));
}

export default async function AdminSystemCheckPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'super_admin') redirect('/home');

  const envLabel = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown';
  const adminSupabase = createAdminSupabaseClient();
  const serverSupabase = await createServerSupabaseClient();
  const supabaseConnectionStatus = USE_MOCK_DATA
    ? { ok: true, detail: 'mock=true のため Supabase 接続チェックをスキップ' }
    : adminSupabase && serverSupabase
      ? { ok: true, detail: 'server/admin クライアント初期化OK' }
      : { ok: false, detail: '環境変数不足でクライアント初期化不可' };

  const tableChecks = await Promise.all([
    checkTableConnectivity(adminSupabase, 'users'),
    checkTableConnectivity(adminSupabase, 'daily_recommendations'),
    checkTableConnectivity(adminSupabase, 'favorites'),
    checkTableConnectivity(adminSupabase, 'profile_images'),
    checkTableConnectivity(adminSupabase, 'risk_checks'),
  ]);
  const bucketChecks = await checkStorageBuckets(adminSupabase);

  const pwa = manifest();
  const pwaOk = pwa.name === 'HANAKAI Connection' && (pwa.icons?.length ?? 0) > 0;
  const checks: CheckResult[] = [
    {
      label: 'Supabase接続状態',
      ok: supabaseConnectionStatus.ok,
      detail: supabaseConnectionStatus.detail,
    },
    ...tableChecks,
    ...bucketChecks,
    {
      label: 'PWA manifest確認',
      ok: pwaOk,
      detail: pwaOk ? `OK (${pwa.icons?.length ?? 0} icons)` : 'manifest定義を確認してください',
    },
  ];

  return (
    <AdminShell user={user}>
      <section className='space-y-4'>
        <article className='rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
          <h1 className='text-xl font-bold text-slate-900'>本番動作確認チェックリスト</h1>
          <p className='mt-1 text-sm text-slate-500'>super_admin 用のシステムヘルス確認ページ</p>
          <div className='mt-3 flex flex-wrap gap-2 text-xs'>
            <Badge tone='gray'>現在の環境: {envLabel}</Badge>
            <Badge tone={USE_MOCK_DATA ? 'amber' : 'green'}>NEXT_PUBLIC_USE_MOCK: {String(USE_MOCK_DATA)}</Badge>
            <Badge tone='navy'>現在ログイン中ユーザー role: {user.role}</Badge>
          </div>
        </article>

        <article className='rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h2 className='font-semibold text-slate-900'>環境情報</h2>
          <ul className='mt-2 space-y-1 text-xs text-slate-600'>
            <li>本番URL: https://hanakai.kranz.design</li>
            <li>PWA manifest URL: /manifest.webmanifest</li>
            <li>manifest name: {String(pwa.name)}</li>
            <li>manifest display: {String(pwa.display)}</li>
          </ul>
        </article>

        <article className='rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h2 className='font-semibold text-slate-900'>疎通チェック</h2>
          <div className='mt-3 space-y-2'>
            {checks.map((check) => (
              <div key={check.label} className='rounded-xl border border-slate-100 bg-slate-50/70 p-3'>
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-sm font-semibold text-slate-900'>{check.label}</p>
                  <Badge tone={check.ok ? 'green' : 'amber'}>{check.ok ? 'OK' : 'NG'}</Badge>
                </div>
                <p className='mt-1 text-xs text-slate-600'>{check.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AdminShell>
  );
}
