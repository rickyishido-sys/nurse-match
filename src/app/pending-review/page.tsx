import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Badge } from '@/components/badges';
import { getCurrentUser, getFemaleProfileByUserId, getMaleProfileByUserId } from '@/lib/data';

export default async function PendingReviewPage() {
  const user = await getCurrentUser();
  const femaleProfile = user?.gender === 'female' ? await getFemaleProfileByUserId(user.id) : null;
  const maleProfile = user?.gender === 'male' ? await getMaleProfileByUserId(user.id) : null;

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_22px_56px_-36px_rgba(15,23,42,0.5)]'>
          <h1 className='text-xl font-bold text-slate-900'>審査中</h1>
          <p className='mt-2 text-sm text-slate-600'>現在、本人確認を審査中です。</p>
          {user?.gender === 'female' ? (
            <p className='mt-1 text-sm text-slate-600'>看護師資格確認も審査中です。</p>
          ) : (
            <p className='mt-1 text-sm text-slate-600'>現在、入会審査中です。</p>
          )}

          <div className='mt-4 flex flex-wrap gap-2'>
            <Badge tone={user?.verificationStatus === 'approved' ? 'green' : 'amber'}>本人確認: {user?.verificationStatus ?? 'pending'}</Badge>
            {user?.gender === 'female' ? (
              <Badge tone={femaleProfile?.nurseVerificationStatus === 'approved' ? 'pink' : 'amber'}>
                看護師確認: {femaleProfile?.nurseVerificationStatus ?? 'pending'}
              </Badge>
            ) : null}
            {user?.gender === 'male' ? (
              <Badge tone={maleProfile?.maleReviewStatus === 'approved' ? 'green' : 'amber'}>
                男性審査: {maleProfile?.maleReviewStatus ?? 'pending'}
              </Badge>
            ) : null}
          </div>

          <Link href='/home' className='mt-5 inline-flex h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white'>
            ステータスを再確認
          </Link>
        </article>
      </section>
    </AppShell>
  );
}
