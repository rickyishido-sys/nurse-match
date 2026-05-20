import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { getCurrentUser } from '@/lib/data';

export default async function RejectedPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <section className='space-y-4 rounded-3xl bg-white p-6 shadow-lg'>
        <h1 className='text-xl font-bold'>審査結果</h1>
        <p className='text-sm text-slate-600'>審査の結果、現在このアカウントでは利用できません。</p>
        {user?.rejectedReason ? (
          <div className='rounded-2xl bg-slate-50 p-3 text-sm text-slate-700'>理由: {user.rejectedReason}</div>
        ) : null}
        <Link href='/login' className='inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm text-white'>
          ログインへ戻る
        </Link>
      </section>
    </AppShell>
  );
}
