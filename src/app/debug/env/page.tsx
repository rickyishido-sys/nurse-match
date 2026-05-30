export default function DebugEnvPage() {
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasSupabaseAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasAdminEmails = !!process.env.ADMIN_EMAILS;
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
            <dt>hasAdminEmails</dt>
            <dd className='font-semibold'>{String(hasAdminEmails)}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>NEXT_PUBLIC_USE_MOCK</dt>
            <dd className='font-semibold'>{mockValue}</dd>
          </div>
          <div className='flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2'>
            <dt>NEXT_PUBLIC_SITE_URL</dt>
            <dd className='font-semibold'>{String(hasSiteUrl)}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
