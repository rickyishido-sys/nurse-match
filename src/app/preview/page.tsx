import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { DEFAULT_FEMALE_FILTERS, getCandidateCards, getCurrentUser } from '@/lib/data';
import { isAdminRole } from '@/lib/guard';

export default async function PreviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (isAdminRole(user.role)) redirect('/admin');
  if (user.onboardingStatus === 'verified') redirect('/home');

  const candidates = (await getCandidateCards(user, DEFAULT_FEMALE_FILTERS)).slice(0, 3);

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h1 className='text-lg font-bold text-slate-900'>まずは雰囲気を見てみる</h1>
          <p className='mt-2 text-sm leading-6 text-slate-600'>本人確認後、メッセージとマッチングが利用できます。</p>
          <ul className='mt-2 space-y-1 text-xs text-slate-500'>
            <li>・写真は1枚目のみ表示</li>
            <li>・Like / チャット / マッチ成立は利用不可</li>
            <li>・詳細プロフィールは本人確認後に解放</li>
          </ul>
          <Link href='/profile/edit' className='mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white'>
            本人確認に進む
          </Link>
        </article>

        <article className='space-y-2 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          {candidates.length === 0 ? (
            <p className='text-sm text-slate-500'>プレビュー候補は準備中です。</p>
          ) : (
            candidates.map((card) => (
              <div key={card.user.id} className='overflow-hidden rounded-2xl border border-slate-100'>
                <div className='relative h-52'>
                  <Image src={card.user.profileImageUrl} alt={card.user.nickname} fill className='object-cover' />
                </div>
                <div className='p-3'>
                  <p className='font-semibold text-slate-900'>{card.user.nickname}</p>
                  <p className='text-xs text-slate-500'>詳細プロフィールは本人確認後に表示されます</p>
                </div>
              </div>
            ))
          )}
        </article>
      </section>
    </AppShell>
  );
}
