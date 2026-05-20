import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { getCurrentUser } from '@/lib/data';

export default async function SuspendedPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <section className='space-y-4 rounded-3xl bg-white p-6 shadow-lg'>
        <h1 className='text-xl font-bold'>アカウント停止中</h1>
        <p className='text-sm text-slate-600'>このアカウントは現在停止されています。運営へお問い合わせください。</p>
        <Link href='/login' className='inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm text-white'>
          ログインへ戻る
        </Link>
      </section>
    </AppShell>
  );
}
