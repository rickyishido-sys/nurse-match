import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/badges';
import { AppShell } from '@/components/app-shell';
import { SwipeCard } from '@/components/swipe-card';
import { setFemaleSearchPreferenceAction, swipeAction } from '@/lib/actions';
import { DEFAULT_FEMALE_FILTERS, getCandidateCards, getCurrentUser } from '@/lib/data';
import { getAccessState } from '@/lib/guard';
import { maritalStatusLabel } from '@/lib/labels';

type SearchQuery = {
  view?: 'card' | 'list';
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

function buildViewHref(merged: Partial<SearchQuery>, view: 'card' | 'list') {
  const p = new URLSearchParams();
  const next = { ...merged, view };
  for (const [k, v] of Object.entries(next)) {
    if (typeof v === 'string' && v.length > 0) p.set(k, v);
  }
  return `/home/female?${p.toString()}`;
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
  if (user.gender !== 'female') redirect('/home/male');

  const state = await getAccessState(user);
  if (state === 'pending') redirect('/pending-review');
  if (state === 'rejected') redirect('/rejected');
  if (state === 'suspended') redirect('/suspended');

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

  const viewMode = merged.view ?? 'card';
  const cards = await getCandidateCards(user, filters);

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-lg font-bold text-slate-900'>条件検索</h1>
              <p className='text-sm text-slate-500'>審査制マッチング向けの詳細検索</p>
            </div>
            <div className='grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-xs'>
              <Link href={buildViewHref(merged, 'card')} className={`rounded-lg px-3 py-2 text-center ${viewMode === 'card' ? 'bg-white text-slate-900' : 'text-slate-500'}`}>
                カード
              </Link>
              <Link href={buildViewHref(merged, 'list')} className={`rounded-lg px-3 py-2 text-center ${viewMode === 'list' ? 'bg-white text-slate-900' : 'text-slate-500'}`}>
                一覧
              </Link>
            </div>
          </div>

          <form className='space-y-2 rounded-2xl bg-slate-50 p-3'>
            <div className='grid grid-cols-2 gap-2 text-xs'>
              <input name='ageMin' defaultValue={String(filters.ageMin)} placeholder='年齢下限' className='h-10 rounded-lg border border-slate-200 bg-white px-2' />
              <input name='ageMax' defaultValue={String(filters.ageMax)} placeholder='年齢上限' className='h-10 rounded-lg border border-slate-200 bg-white px-2' />
              <input name='location' defaultValue={filters.location} placeholder='地域' className='h-10 rounded-lg border border-slate-200 bg-white px-2' />
              <input name='job' defaultValue={filters.job} placeholder='職種' className='h-10 rounded-lg border border-slate-200 bg-white px-2' />
              <input name='incomeMin' defaultValue={filters.incomeMin} placeholder='最低年収（例: 500万円）' className='h-10 rounded-lg border border-slate-200 bg-white px-2' />
              <input name='heightMin' defaultValue={String(filters.heightMin || '')} placeholder='最低身長' className='h-10 rounded-lg border border-slate-200 bg-white px-2' />
              <input name='smoking' defaultValue={filters.smoking} placeholder='喫煙' className='h-10 rounded-lg border border-slate-200 bg-white px-2' />
              <input name='drinking' defaultValue={filters.drinking} placeholder='飲酒' className='h-10 rounded-lg border border-slate-200 bg-white px-2' />
            </div>

            <select name='maritalFilter' defaultValue={filters.maritalFilter} className='h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs'>
              <option value='single_only'>独身のみ</option>
              <option value='include_married'>既婚含む</option>
              <option value='include_partner'>パートナーあり含む</option>
            </select>

            <div className='grid grid-cols-2 gap-2 text-xs text-slate-600'>
              <label className='flex items-center gap-2'><input type='checkbox' name='verifiedOnly' defaultChecked={filters.verifiedOnly} /> 本人確認済みのみ</label>
              <label className='flex items-center gap-2'><input type='checkbox' name='maleReviewedOnly' defaultChecked={filters.maleReviewedOnly} /> 男性審査通過のみ</label>
              <label className='flex items-center gap-2'><input type='checkbox' name='incomeVerifiedOnly' defaultChecked={filters.incomeVerifiedOnly} /> 年収確認済みのみ</label>
              <label className='flex items-center gap-2'><input type='checkbox' name='facePhotoOnly' defaultChecked={filters.facePhotoOnly} /> 顔写真ありのみ</label>
            </div>

            <input type='hidden' name='view' value={viewMode} />
            <div className='grid grid-cols-2 gap-2'>
              <button className='h-10 rounded-xl border border-slate-200 bg-white text-sm'>条件で検索</button>
              <button formAction={setFemaleSearchPreferenceAction} className='h-10 rounded-xl bg-slate-900 text-sm font-semibold text-white'>
                条件を保存
              </button>
            </div>
          </form>
        </article>

        {cards.length === 0 ? (
          <div className='rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-sm'>
            条件に合う候補がいません。
          </div>
        ) : viewMode === 'card' ? (
          cards.map((card) => (
            <div key={card.user.id} className='space-y-3'>
              <SwipeCard user={card.user} maleProfile={card.maleProfile} femaleProfile={card.femaleProfile} />
              <div className='grid grid-cols-2 gap-3'>
                <form action={swipeAction}>
                  <input type='hidden' name='fromUserId' value={user.id} />
                  <input type='hidden' name='toUserId' value={card.user.id} />
                  <input type='hidden' name='action' value='skip' />
                  <button className='h-12 w-full rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700'>Skip</button>
                </form>
                <form action={swipeAction}>
                  <input type='hidden' name='fromUserId' value={user.id} />
                  <input type='hidden' name='toUserId' value={card.user.id} />
                  <input type='hidden' name='action' value='like' />
                  <button className='h-12 w-full rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-lg shadow-slate-900/20'>Like</button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className='space-y-2'>
            {cards.map((card) => (
              <article key={card.user.id} className='rounded-2xl border border-slate-100 bg-white p-3 shadow-sm'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex gap-2'>
                    <div className='relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200'>
                      <Image src={card.user.profileImageUrl} alt={card.user.nickname} fill className='object-cover' />
                    </div>
                    <div>
                    <p className='text-sm font-semibold text-slate-900'>
                      {card.user.nickname}・{card.user.age}
                    </p>
                    <p className='text-xs text-slate-500'>{card.user.location}</p>
                    {card.maleProfile ? (
                      <p className='mt-1 text-xs text-slate-600'>
                        職種 {card.maleProfile.job} / 年収 {card.maleProfile.income} / {maritalStatusLabel(card.maleProfile.maritalStatus)}
                      </p>
                    ) : null}
                    </div>
                  </div>
                  <div className='flex flex-wrap justify-end gap-1'>
                    <Badge tone='green'>本人確認済み</Badge>
                    {card.maleProfile?.maleReviewStatus === 'approved' ? <Badge tone='navy'>審査通過</Badge> : null}
                    {card.maleProfile?.maritalStatus === 'single' ? <Badge tone='amber'>独身</Badge> : null}
                    {card.maleProfile?.incomeVerified ? <Badge tone='green'>年収確認済み</Badge> : null}
                    {card.maleProfile?.facePhotoVerified ? <Badge tone='green'>顔写真確認済み</Badge> : null}
                  </div>
                </div>
                <div className='mt-2 grid grid-cols-2 gap-2'>
                  <form action={swipeAction}>
                    <input type='hidden' name='fromUserId' value={user.id} />
                    <input type='hidden' name='toUserId' value={card.user.id} />
                    <input type='hidden' name='action' value='skip' />
                    <button className='h-10 w-full rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700'>Skip</button>
                  </form>
                  <form action={swipeAction}>
                    <input type='hidden' name='fromUserId' value={user.id} />
                    <input type='hidden' name='toUserId' value={card.user.id} />
                    <input type='hidden' name='action' value='like' />
                    <button className='h-10 w-full rounded-xl bg-slate-900 text-xs font-semibold text-white'>Like</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
