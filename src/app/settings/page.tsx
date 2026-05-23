import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { getCurrentUser } from '@/lib/data';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h1 className='text-lg font-bold text-slate-900'>設定</h1>
          <p className='text-sm text-slate-600'>安全に利用できるよう、プロフィールやプライバシー設定を管理できます。</p>
        </article>
        <article className='space-y-2 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm text-sm'>
          <Link href='/profile/edit' className='block rounded-xl border border-slate-200 px-3 py-3'>プロフィール編集</Link>
          <Link href='/profile/edit' className='block rounded-xl border border-slate-200 px-3 py-3'>写真編集</Link>
          <button disabled className='w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-slate-500'>通知設定（準備中）</button>
          <Link href='/blocked-users' className='block rounded-xl border border-slate-200 px-3 py-3'>ブロック一覧</Link>
          <Link href='/delete-account' className='block rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-red-700'>退会</Link>
        </article>
      </section>
    </AppShell>
  );
}
