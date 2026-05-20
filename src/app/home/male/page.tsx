import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Badge } from '@/components/badges';
import { getCurrentUser, getMaleProfileByUserId, getMatches } from '@/lib/data';
import { getAccessState } from '@/lib/guard';
import { maritalStatusLabel } from '@/lib/labels';

function getProfileCompletionScore(
  maleProfile: Awaited<ReturnType<typeof getMaleProfileByUserId>>,
  bio: string,
) {
  if (!maleProfile) return 0;
  const checks = [maleProfile.job, maleProfile.income, maleProfile.maritalStatus, maleProfile.height, maleProfile.bodyType, bio];
  const filled = checks.filter((v) => Boolean(v)).length;
  return Math.round((filled / checks.length) * 100);
}

export default async function MaleHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.gender !== 'male') redirect('/home/female');

  const state = await getAccessState(user);
  if (state === 'pending') redirect('/pending-review');
  if (state === 'rejected') redirect('/rejected');
  if (state === 'suspended') redirect('/suspended');

  const matches = await getMatches(user.id);
  const maleProfile = await getMaleProfileByUserId(user.id);
  const completion = getProfileCompletionScore(maleProfile, user.bio);

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_22px_56px_-36px_rgba(15,23,42,0.5)]'>
          <h1 className='text-lg font-bold text-slate-900'>男性用ホーム</h1>
          <p className='mt-2 text-sm text-slate-700'>あなたは候補として表示されています。</p>
          <p className='text-sm text-slate-600'>女性から選ばれるのを待つ仕組みです。</p>

          <div className='mt-3 flex flex-wrap gap-2'>
            <Badge tone='green'>本人確認: {user.verificationStatus}</Badge>
            <Badge tone='navy'>男性審査: {maleProfile?.maleReviewStatus ?? 'pending'}</Badge>
            <Badge tone='gray'>婚姻状態: {maleProfile ? maritalStatusLabel(maleProfile.maritalStatus) : '-'}</Badge>
          </div>

          <div className='mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3'>
            <p className='text-xs font-semibold text-slate-600'>プロフィール完成度 {completion}%</p>
            <div className='mt-2 h-2 rounded-full bg-slate-200'>
              <div className='h-2 rounded-full bg-slate-900' style={{ width: `${completion}%` }} />
            </div>
          </div>

          <div className='mt-4 grid grid-cols-2 gap-2'>
            <Link href='/profile/edit' className='h-11 rounded-xl border border-slate-200 px-3 text-center text-sm font-semibold leading-[44px]'>
              プロフィール編集
            </Link>
            <Link href='/matches' className='h-11 rounded-xl bg-slate-900 px-3 text-center text-sm font-semibold leading-[44px] text-white'>
              マッチを見る
            </Link>
          </div>
        </article>

        <article className='rounded-3xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500'>
          有料プラン導線（今後実装予定）
        </article>

        <article className='rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
          <h2 className='mb-2 font-semibold text-slate-900'>マッチ済み</h2>
          {matches.length === 0 ? (
            <p className='text-sm text-slate-500'>まだマッチしていません。</p>
          ) : (
            <ul className='space-y-2 text-sm'>
              {matches.map(({ match, partner }) =>
                partner ? (
                  <li key={match.id}>
                    <Link href={`/chat/${match.id}`} className='block rounded-xl border border-slate-200 bg-slate-50 px-3 py-3'>
                      {partner.nickname} さんとのチャット
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </article>
      </section>
    </AppShell>
  );
}
