import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { toggleFavoriteAction } from '@/lib/actions';
import { DEFAULT_FEMALE_FILTERS, generateDailyRecommendations, getCandidateCards, getCurrentUser, getDailyRecommendationCards, getFavoriteTargetIds } from '@/lib/data';
import { isAdminRole } from '@/lib/guard';

/** 旧 Nurse Match オンボーディングプレビュー（/preview から移行） */
export default async function OnboardingPreviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (isAdminRole(user.role)) redirect('/admin');
  if (user.onboardingStatus === 'verified') redirect('/home');

  const candidates =
    user.gender === 'female'
      ? (await (async () => {
          await generateDailyRecommendations(user.id);
          const recommended = await getDailyRecommendationCards(user);
          return recommended
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
            .map((item) => ({
              user: item.user,
              recommendation: item.recommendation,
            }));
        })()).slice(0, 3)
      : (await getCandidateCards(user, DEFAULT_FEMALE_FILTERS))
          .slice(0, 3)
          .map((item) => ({ user: item.user, recommendation: null }));
  const favorites = await getFavoriteTargetIds(user.id);

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h1 className='text-lg font-bold text-slate-900'>まずは雰囲気を見てみる</h1>
          <p className='mt-2 text-sm leading-6 text-slate-600'>本人確認後、Likeとメッセージが利用できます。</p>
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
                  <p className='font-semibold text-slate-900'>{card.user.nickname}</p>
                  <p className='text-xs text-slate-500'>{card.user.age}歳 / {card.user.location}</p>
                </div>
              </div>
            ))
          )}
        </article>
      </section>
    </AppShell>
  );
}
