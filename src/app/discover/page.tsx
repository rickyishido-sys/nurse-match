import Image from 'next/image';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { swipeSubmitAction } from '@/lib/actions';
import { getCurrentUser, getDailyRecommendationCards } from '@/lib/data';
import { getAccessState } from '@/lib/guard';
import type { MaleProfile } from '@/lib/types/domain';

function valueLabel(profile: MaleProfile | null, key: 'housework' | 'childcare' | 'night' | 'dual') {
  if (!profile) return 'プロフィールで確認中';
  if (key === 'housework') return profile.personalityTags.find((tag) => tag.includes('家事')) ?? 'プロフィールで確認中';
  if (key === 'childcare') return profile.personalityTags.find((tag) => tag.includes('育児')) ?? 'プロフィールで確認中';
  if (key === 'night') return profile.nightShiftUnderstanding ? '理解あり' : '要確認';
  return profile.shiftWorkUnderstanding ? '理解あり' : '要確認';
}

export default async function DiscoverPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.gender !== 'female') redirect('/home/male');

  const state = await getAccessState(user);
  if (state === 'pending') redirect('/pending-review');
  if (state === 'rejected') redirect('/review-rejected');
  if (state === 'suspended') redirect('/suspended');

  const recommendationRows = await getDailyRecommendationCards(user);
  const cards = recommendationRows.filter((row) => row.user.gender === 'male').slice(0, 10);

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='rounded-3xl border border-pink-100 bg-white p-5 shadow-sm'>
          <h1 className='text-xl font-bold text-slate-900'>本日のおすすめ男性</h1>
          <p className='mt-1 text-sm text-slate-600'>AI選別済みの体裁で、今日の候補を10名まで表示しています。</p>
        </article>

        {cards.length === 0 ? (
          <article className='rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-sm'>本日の候補は準備中です。</article>
        ) : (
          cards.map((card) => (
            <article key={card.user.id} className='space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
              <div className='flex gap-3'>
                <div className='relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100'>
                  {card.user.profileImageUrl ? (
                    <Image src={card.user.profileImageUrl} alt={card.user.nickname} fill className='object-cover' />
                  ) : (
                    <span className='flex h-full w-full items-center justify-center text-2xl text-slate-400'>
                      {card.user.nickname?.charAt(0) ?? '？'}
                    </span>
                  )}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-base font-semibold text-slate-900'>
                    {card.user.nickname}・{card.user.age}
                  </p>
                  <p className='text-xs text-slate-600'>{card.user.location}</p>
                  <p className='text-xs text-slate-600'>職種: {card.maleProfile?.job || '未設定'}</p>
                  <p className='mt-1 line-clamp-2 text-xs text-slate-500'>{card.user.bio}</p>
                </div>
              </div>
              {card.recommendation?.reason ? (
                <p className='rounded-xl bg-pink-50 px-3 py-2 text-xs text-pink-700'>選ばれた理由: {card.recommendation.reason}</p>
              ) : null}
              <div className='grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700'>
                <p>家事観: {valueLabel(card.maleProfile, 'housework')}</p>
                <p>育児観: {valueLabel(card.maleProfile, 'childcare')}</p>
                <p>夜勤理解: {valueLabel(card.maleProfile, 'night')}</p>
                <p>共働き理解: {valueLabel(card.maleProfile, 'dual')}</p>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <form action={swipeSubmitAction}>
                  <input type='hidden' name='fromUserId' value={user.id} />
                  <input type='hidden' name='toUserId' value={card.user.id} />
                  <input type='hidden' name='action' value='like' />
                  <button className='h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white'>興味あり</button>
                </form>
                <form action={swipeSubmitAction}>
                  <input type='hidden' name='fromUserId' value={user.id} />
                  <input type='hidden' name='toUserId' value={card.user.id} />
                  <input type='hidden' name='action' value='skip' />
                  <button className='h-11 w-full rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700'>スキップ</button>
                </form>
              </div>
            </article>
          ))
        )}
      </section>
    </AppShell>
  );
}

