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
        <article className='rounded-3xl border border-sky-100 bg-sky-50/70 p-4 text-xs leading-6 text-slate-700 shadow-sm'>
          <p className='font-semibold text-slate-800'>安心して使うための取り組み</p>
          <ul className='mt-2 space-y-1'>
            <li>・本人確認と登録審査</li>
            <li>・通報対応（運営が順次確認）</li>
            <li>・ブロック機能（相互非表示）</li>
            <li>・いつでも退会可能</li>
          </ul>
        </article>
        <article className='space-y-2 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm text-sm'>
          <Link href='/profile/edit' className='block rounded-xl border border-slate-200 px-3 py-3'>プロフィール編集</Link>
          <Link href='/profile/edit' className='block rounded-xl border border-slate-200 px-3 py-3'>写真編集</Link>
          <button disabled className='w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-slate-500'>通知設定（準備中）</button>
          <Link href='/blocked-users' className='block rounded-xl border border-slate-200 px-3 py-3'>ブロック一覧</Link>
          <Link href='/delete-account' className='block rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-red-700'>退会</Link>
          <div className='grid grid-cols-2 gap-2 text-xs'>
            <Link href='/terms' className='rounded-xl border border-slate-200 px-3 py-2 text-center text-slate-600'>利用規約</Link>
            <Link href='/privacy' className='rounded-xl border border-slate-200 px-3 py-2 text-center text-slate-600'>プライバシー</Link>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
