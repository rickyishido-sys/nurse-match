import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { getCurrentUser } from '@/lib/data';

export default async function DeleteAccountPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <section className='space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
        <h1 className='text-xl font-bold text-slate-900'>退会・アカウント削除</h1>
        <p className='text-sm leading-7 text-slate-600'>
          ストア審査対応のため、退会導線を明示しています。現時点は UI のみで、削除実行APIは今後実装予定です。
        </p>
        <button disabled className='w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-500'>
          退会リクエスト送信（準備中）
        </button>
        <Link href='/privacy' className='inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700'>
          データポリシーを確認
        </Link>
      </section>
    </AppShell>
  );
}
