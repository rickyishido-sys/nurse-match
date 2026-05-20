import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { getCurrentUser } from '@/lib/data';

export default async function CommunityGuidelinesPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <section className='space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
        <h1 className='text-xl font-bold text-slate-900'>コミュニティガイドライン</h1>
        <ul className='space-y-2 text-sm leading-7 text-slate-600'>
          <li>・不適切な言動、誹謗中傷、ハラスメントは禁止</li>
          <li>・危険行為や金銭要求は禁止</li>
          <li>・なりすまし、虚偽プロフィールは禁止</li>
          <li>・違反報告があった場合は審査・処分対象</li>
        </ul>
        <div className='flex gap-2'>
          <Link href='/blocked-users' className='rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700'>
            ブロック管理（準備）
          </Link>
          <Link href='/delete-account' className='rounded-xl bg-slate-900 px-4 py-2 text-sm text-white'>
            退会導線（準備）
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
