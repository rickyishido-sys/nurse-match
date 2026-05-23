import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { DeleteAccountForm } from '@/components/delete-account-form';
import { getCurrentUser } from '@/lib/data';

export default async function DeleteAccountPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <section className='space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
        <h1 className='text-xl font-bold text-slate-900'>退会・アカウント削除</h1>
        <p className='text-sm leading-7 text-slate-600'>
          退会すると、アカウントは利用停止となりログアウトされます。元に戻すことはできません。
        </p>
        <p className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600'>
          退会後は `deleted_at` を用いた論理削除で管理し、マッチ候補・チャット・表示一覧から除外されます。
        </p>
        <DeleteAccountForm />
        <Link href='/privacy' className='inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700'>
          データポリシーを確認
        </Link>
      </section>
    </AppShell>
  );
}
