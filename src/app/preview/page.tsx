import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { toggleFavoriteAction } from '@/lib/actions';
import { DEFAULT_FEMALE_FILTERS, getCandidateCards, getCurrentUser, getFavoriteTargetIds } from '@/lib/data';
import { isAdminRole } from '@/lib/guard';

export default async function PreviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (isAdminRole(user.role)) redirect('/admin');
  if (user.onboardingStatus === 'verified') redirect('/home');

  const candidates = (await getCandidateCards(user, DEFAULT_FEMALE_FILTERS)).slice(0, 3);
  const favorites = await getFavoriteTargetIds(user.id);

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h1 className='text-lg font-bold text-slate-900'>まずは雰囲気を見てみる</h1>
          <p className='mt-2 text-sm leading-6 text-slate-600'>本人確認後、Likeとメッセージが利用できます。</p>
          <ul className='mt-2 space-y-1 text-xs text-slate-500'>
            <li>・写真は1枚目のみ表示</li>
            <li>・Like / チャット / マッチ成立は利用不可</li>
            <li>・詳細プロフィールは本人確認後に解放</li>
          </ul>
          <Link href='/profile/edit' className='mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white'>
            本人確認して利用を開始する
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
                  <p className='font-semibold text-slate-900'>
                    {card.user.nickname}
                    {favorites.has(card.user.id) ? <span className='ml-2 text-xs text-emerald-600'>お気に入り済み</span> : null}
                  </p>
                  <p className='text-xs text-slate-500'>{card.user.age}歳 / {card.user.location}</p>
                  <p className='mt-1 text-xs text-slate-500'>詳細プロフィールは本人確認後に表示されます</p>
                  <form action={toggleFavoriteAction} className='mt-2'>
                    <input type='hidden' name='userId' value={user.id} />
                    <input type='hidden' name='targetUserId' value={card.user.id} />
                    <button className='h-9 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700'>
                      気になる人を保存
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </article>
      </section>
    </AppShell>
  );
}
