import Link from 'next/link';
import { redirect } from 'next/navigation';
import { HanakaiWordmark } from '@/components/hanakai/wordmark';
import { getCurrentUser } from '@/lib/data';
import { isAdminRole } from '@/lib/guard';
import { logoutAction } from '@/lib/actions';

export default async function PendingReviewPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?error=session_not_found');
  }
  if (isAdminRole(user.role)) {
    if (user.role === 'female_admin') redirect('/admin/female');
    if (user.role === 'male_admin') redirect('/admin/male');
    redirect('/admin');
  }

  return (
    <main className='min-h-screen bg-[#fafaf8] px-5 py-8'>
      <div className='mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[480px] flex-col'>
        <div className='mb-8 flex justify-center'>
          <HanakaiWordmark href='/home' />
        </div>

        <section className='flex-1 space-y-5 rounded-3xl border border-[#ebe9e4] bg-white px-6 py-8 shadow-[0_1px_8px_rgba(31,93,79,0.04)]'>
          <h1 className='text-xl font-semibold tracking-tight text-[#1a1a1a]'>参加内容を確認しています</h1>
          <div className='space-y-4 text-sm leading-7 text-[#6b6b6b]'>
            <p>現在、プロフィール内容を確認しています。</p>
            <p>安心して交流できるコミュニティを維持するため、運営チームが内容を確認しています。</p>
            <p>確認完了後、メールまたはアプリ内でお知らせします。</p>
          </div>
          <p className='rounded-2xl border border-[#ebe9e4] bg-[#fbfaf7] px-4 py-3 text-sm leading-7 text-[#6b6b6b]'>
            承認後はイベント参加、Connection、グループ機能などをご利用いただけます。
          </p>

          <div className='flex flex-col gap-2 pt-2 sm:flex-row'>
            <Link
              href='/home'
              className='inline-flex h-11 flex-1 items-center justify-center rounded-full bg-[#1f5d4f] px-5 text-sm font-semibold text-white'
            >
              トップへ戻る
            </Link>
            <form action={logoutAction} className='flex-1'>
              <button
                type='submit'
                className='inline-flex h-11 w-full items-center justify-center rounded-full border border-[#e2ddd2] px-5 text-sm font-semibold text-[#6b6b6b]'
              >
                ログアウト
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
