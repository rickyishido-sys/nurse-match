import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { FemaleCardDeck } from '@/components/female-card-deck';
import { toggleFavoriteAction } from '@/lib/actions';
import { DEFAULT_FEMALE_FILTERS, generateDailyRecommendations, getCandidateCards, getCurrentUser, getDailyRecommendationCards } from '@/lib/data';
import { getAccessState, isAdminRole } from '@/lib/guard';
import { maritalStatusLabel } from '@/lib/labels';

type SearchQuery = {
  ageMin?: string;
  ageMax?: string;
  location?: string;
  job?: string;
  incomeMin?: string;
  maritalFilter?: 'single_only' | 'include_married' | 'include_partner';
  verifiedOnly?: 'on';
  maleReviewedOnly?: 'on';
  incomeVerifiedOnly?: 'on';
  facePhotoOnly?: 'on';
  smoking?: string;
  drinking?: string;
  heightMin?: string;
};

function toBool(v: string | undefined, defaultValue: boolean) {
  if (v === undefined) return defaultValue;
  return v === 'on';
}

function normalizeCookie(value?: string): Partial<SearchQuery> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as Partial<SearchQuery>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export default async function FemaleHomePage({ searchParams }: { searchParams: Promise<SearchQuery> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (isAdminRole(user.role)) {
    if (user.role === 'female_admin') redirect('/admin/female');
    if (user.role === 'male_admin') redirect('/admin/male');
    redirect('/admin');
  }
  if (user.gender !== 'female') redirect('/home/male');

  const state = await getAccessState(user);
  if (state === 'rejected') redirect('/rejected');
  if (state === 'suspended') redirect('/suspended');
  if (user.onboardingStatus !== 'verified') redirect('/preview');
  if (state === 'pending') redirect('/pending-review');

  const params = await searchParams;
  const cookieStore = await cookies();
  const fromCookie = normalizeCookie(cookieStore.get('female_search_filters')?.value);
  const merged = { ...fromCookie, ...params };

  const filters = {
    maritalFilter: merged.maritalFilter ?? DEFAULT_FEMALE_FILTERS.maritalFilter,
    ageMin: Number(merged.ageMin ?? DEFAULT_FEMALE_FILTERS.ageMin),
    ageMax: Number(merged.ageMax ?? DEFAULT_FEMALE_FILTERS.ageMax),
    location: merged.location ?? DEFAULT_FEMALE_FILTERS.location,
    job: merged.job ?? DEFAULT_FEMALE_FILTERS.job,
    incomeMin: merged.incomeMin ?? DEFAULT_FEMALE_FILTERS.incomeMin,
    smoking: merged.smoking ?? DEFAULT_FEMALE_FILTERS.smoking,
    drinking: merged.drinking ?? DEFAULT_FEMALE_FILTERS.drinking,
    heightMin: Number(merged.heightMin ?? DEFAULT_FEMALE_FILTERS.heightMin),
    verifiedOnly: toBool(merged.verifiedOnly, DEFAULT_FEMALE_FILTERS.verifiedOnly),
    maleReviewedOnly: toBool(merged.maleReviewedOnly, DEFAULT_FEMALE_FILTERS.maleReviewedOnly),
    incomeVerifiedOnly: toBool(merged.incomeVerifiedOnly, DEFAULT_FEMALE_FILTERS.incomeVerifiedOnly),
    facePhotoOnly: toBool(merged.facePhotoOnly, DEFAULT_FEMALE_FILTERS.facePhotoOnly),
  };

  const cards = await getCandidateCards(user, filters);
  await generateDailyRecommendations(user.id);
  const recommendations = await getDailyRecommendationCards(user);
  const featuredRecommendations = recommendations.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)).slice(0, 5);

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <div>
            <h1 className='text-lg font-bold text-slate-900'>本日の厳選メンバー</h1>
            <p className='text-sm text-slate-500'>あなたに合う5名を厳選しました</p>
          </div>
          {featuredRecommendations.length === 0 ? (
            <p className='text-sm text-slate-500'>本日のおすすめ候補は準備中です。</p>
          ) : (
            <div className='space-y-2'>
              {featuredRecommendations.map((entry) => (
                <article key={entry.recommendation.id} className='rounded-2xl border border-slate-100 bg-slate-50/70 p-3'>
                  <div className='flex items-center gap-3'>
                    <div className='relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200'>
                      <Image src={entry.user.profileImageUrl} alt={entry.user.nickname} fill className='object-cover' />
                    </div>
                    <div className='flex-1'>
                      <p className='text-sm font-semibold text-slate-900'>
                        #{entry.recommendation.rank} {entry.user.nickname}・{entry.user.age}
                      </p>
                      <p className='text-xs text-slate-600'>{entry.user.location}</p>
                      {entry.maleProfile ? (
                        <p className='text-xs text-slate-600'>
                          職種 {entry.maleProfile.job} / 婚姻 {maritalStatusLabel(entry.maleProfile.maritalStatus)}
                        </p>
                      ) : null}
                      <p className='mt-1 line-clamp-1 text-[11px] text-slate-500'>{entry.recommendation.reason}</p>
                    </div>
                  </div>
                  <div className='mt-2 grid grid-cols-3 gap-1'>
                    <form action={toggleFavoriteAction}>
                      <input type='hidden' name='userId' value={user.id} />
                      <input type='hidden' name='targetUserId' value={entry.user.id} />
                      <button className='h-9 w-full rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700'>保存</button>
                    </form>
                    <Link href={`/favorites`} className='col-span-2 flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700'>
                      詳細を見る
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <FemaleCardDeck userId={user.id} cards={cards} filters={filters} />
      </section>
    </AppShell>
  );
}
