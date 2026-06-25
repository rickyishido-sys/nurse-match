import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { getCurrentUser } from '@/lib/data';

export default async function VerificationPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/register');

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
          <h1 className='text-xl font-bold text-slate-900'>審査確認中です</h1>
          <p className='mt-2 text-sm leading-6 text-slate-600'>
            プロフィール登録が完了しました。運営による確認後、順次機能を解放します。
          </p>
        </article>
        <article className='rounded-3xl border border-slate-100 bg-white p-5 text-sm shadow-sm'>
          <p className='text-slate-600'>進捗はプレビュー画面で確認できます。</p>
          <Link href='/onboarding-preview' className='mt-3 inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white'>
            プレビューへ
          </Link>
        </article>
      </section>
    </AppShell>
  );
}
