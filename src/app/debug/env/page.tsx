import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/data';
import { isAdminRole } from '@/lib/guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DebugEnvPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isAdminRole(user.role)) {
    return (
      <main className='min-h-screen bg-slate-50 px-4 py-8'>
        <section className='mx-auto max-w-[480px] rounded-3xl border border-red-100 bg-white p-5 shadow-sm'>
          <h1 className='text-lg font-bold text-slate-900'>Access denied</h1>
          <p className='mt-2 text-sm text-slate-600'>このページは管理者のみ閲覧できます。</p>
        </section>
      </main>
    );
  }

  const envKeys = Object.keys(process.env)
    .filter((key) => key.includes('SUPABASE') || key.includes('ADMIN'))
    .sort();
  const serviceRoleKeyNameDetected = envKeys.includes('SUPABASE_SERVICE_ROLE_KEY');
  const adminEmailsNameDetected = envKeys.includes('ADMIN_EMAILS');
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasSupabaseAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.length > 20);
  const hasAdminEmails = !!process.env.ADMIN_EMAILS;
  const serviceRoleValue = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const anonKeyValue = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const serviceRoleKeyLength = process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0;
  const adminEmailsLength = process.env.ADMIN_EMAILS?.length ?? 0;
  const anonKeyLength = anonKeyValue.length;
  const serviceRoleKeyDotCount = (serviceRoleValue.match(/\./g) ?? []).length;
  const anonKeyDotCount = (anonKeyValue.match(/\./g) ?? []).length;
  const serviceRoleStartsWithEyJ = serviceRoleValue.startsWith('eyJ');
  const anonStartsWithEyJ = anonKeyValue.startsWith('eyJ');
  const serviceRoleJwtShapeOk = serviceRoleKeyDotCount === 2 && serviceRoleKeyLength > 100 && serviceRoleStartsWithEyJ;
  const anonJwtShapeOk = anonKeyDotCount === 2 && anonKeyLength > 100 && anonStartsWithEyJ;
  const supabaseUrlHost = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host;
      } catch {
        return '(invalid-url)';
      }
    })()
    : '(unset)';
  const mockValue = process.env.NEXT_PUBLIC_USE_MOCK ?? '(unset)';
  const hasSiteUrl = !!process.env.NEXT_PUBLIC_SITE_URL;

  return (
    <main className='min-h-screen bg-slate-50 px-4 py-8'>
      <section className='mx-auto max-w-[480px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm'>
        <h1 className='text-lg font-bold text-slate-900'>Debug Env</h1>
        <p className='mt-1 text-xs text-slate-500'>値そのものは表示せず、設定有無のみ表示します。</p>

        <dl className='mt-4 space-y-2 text-sm'>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>hasSupabaseUrl</dt>
            <dd className='font-semibold'>{String(hasSupabaseUrl)}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>hasAnonKey</dt>
            <dd className='font-semibold'>{String(hasSupabaseAnon)}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>hasServiceRoleKey</dt>
            <dd className='font-semibold'>{String(hasServiceRole)}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>serviceRoleKeyLength</dt>
            <dd className='font-semibold'>{serviceRoleKeyLength}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>serviceRoleKeyDotCount</dt>
            <dd className='font-semibold'>{serviceRoleKeyDotCount}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>serviceRoleStartsWithEyJ</dt>
            <dd className='font-semibold'>{String(serviceRoleStartsWithEyJ)}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>serviceRoleJwtShapeOk</dt>
            <dd className='font-semibold'>{String(serviceRoleJwtShapeOk)}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>anonKeyLength</dt>
            <dd className='font-semibold'>{anonKeyLength}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>anonKeyDotCount</dt>
            <dd className='font-semibold'>{anonKeyDotCount}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>anonStartsWithEyJ</dt>
            <dd className='font-semibold'>{String(anonStartsWithEyJ)}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>anonJwtShapeOk</dt>
            <dd className='font-semibold'>{String(anonJwtShapeOk)}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>supabaseUrlHost</dt>
            <dd className='font-semibold'>{supabaseUrlHost}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>hasAdminEmails</dt>
            <dd className='font-semibold'>{String(hasAdminEmails)}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>adminEmailsLength</dt>
            <dd className='font-semibold'>{adminEmailsLength}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>serviceRoleKeyNameDetected</dt>
            <dd className='font-semibold'>{String(serviceRoleKeyNameDetected)}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>adminEmailsNameDetected</dt>
            <dd className='font-semibold'>{String(adminEmailsNameDetected)}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>NEXT_PUBLIC_USE_MOCK</dt>
            <dd className='font-semibold'>{mockValue}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>NEXT_PUBLIC_SITE_URL</dt>
            <dd className='font-semibold'>{String(hasSiteUrl)}</dd>
          </div>
          <div className='rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>envKeys</dt>
            <dd className='mt-1 break-all font-semibold'>{JSON.stringify(envKeys)}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
