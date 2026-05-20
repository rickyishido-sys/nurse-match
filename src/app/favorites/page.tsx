import Image from 'next/image';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/badges';
import { AppShell } from '@/components/app-shell';
import { favoriteLikeAction, toggleFavoriteAction } from '@/lib/actions';
import { getCurrentUser, getFavoriteCards } from '@/lib/data';
import { isAdminRole } from '@/lib/guard';
import { maritalStatusLabel } from '@/lib/labels';

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (isAdminRole(user.role)) redirect('/admin');

  const favorites = await getFavoriteCards(user.id);

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h1 className='text-lg font-bold text-slate-900'>お気に入り一覧</h1>
          <p className='mt-1 text-xs text-slate-500'>
            {user.onboardingStatus === 'verified'
              ? '利用条件を満たす相手にはLikeを送れます。'
              : '本人確認後、保存した相手へLikeを送れます'}
          </p>
        </article>

        {favorites.length === 0 ? (
          <article className='rounded-3xl border border-slate-100 bg-white p-5 text-sm text-slate-500 shadow-sm'>
            まだお気に入りがありません。/preview で気になる人を保存できます。
          </article>
        ) : (
          favorites.map(({ favorite, user: target, maleProfile }) => {
            if (!target) return null;
            const canLike =
              user.onboardingStatus === 'verified' &&
              user.gender === 'female' &&
              target.onboardingStatus === 'verified' &&
              target.verificationStatus === 'approved';
            return (
              <article key={favorite.id} className='rounded-2xl border border-slate-100 bg-white p-3 shadow-sm'>
                <div className='flex gap-3'>
                  <div className='relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200'>
                    <Image src={target.profileImageUrl} alt={target.nickname} fill className='object-cover' />
                  </div>
                  <div className='flex-1 space-y-1'>
                    <p className='font-semibold text-slate-900'>
                      {target.nickname}・{target.age}
                    </p>
                    <p className='text-xs text-slate-600'>{target.location}</p>
                    <p className='text-xs text-slate-600'>
                      職種: {maleProfile?.job ?? '-'} / 婚姻: {maleProfile ? maritalStatusLabel(maleProfile.maritalStatus) : '-'}
                    </p>
                    <div className='flex flex-wrap gap-1'>
                      {target.verificationStatus === 'approved' ? <Badge tone='green'>本人確認済み</Badge> : <Badge tone='amber'>本人確認待ち</Badge>}
                      {maleProfile?.maleReviewStatus === 'approved' ? <Badge tone='navy'>審査通過</Badge> : null}
                    </div>
                  </div>
                </div>
                <div className='mt-3 grid grid-cols-2 gap-2'>
                  <form action={toggleFavoriteAction}>
                    <input type='hidden' name='userId' value={user.id} />
                    <input type='hidden' name='targetUserId' value={target.id} />
                    <button className='h-10 w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700'>
                      お気に入り解除
                    </button>
                  </form>
                  {user.onboardingStatus === 'verified' ? (
                    <form action={favoriteLikeAction}>
                      <input type='hidden' name='fromUserId' value={user.id} />
                      <input type='hidden' name='toUserId' value={target.id} />
                      <button
                        disabled={!canLike}
                        className={`h-10 w-full rounded-xl text-xs font-semibold ${canLike ? 'bg-slate-900 text-white' : 'cursor-not-allowed bg-slate-200 text-slate-500'}`}
                      >
                        Likeを送る
                      </button>
                    </form>
                  ) : (
                    <div className='flex h-10 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-500'>
                      本人確認後に利用可能
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </AppShell>
  );
}
