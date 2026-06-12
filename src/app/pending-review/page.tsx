import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Badge } from '@/components/badges';
import { getCurrentUser, getFemaleProfileByUserId, getMaleProfileByUserId } from '@/lib/data';
import { isAdminRole } from '@/lib/guard';
import { logoutAction } from '@/lib/actions';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function PendingReviewPage() {
  const user = await getCurrentUser();
  console.log('PENDING_REVIEW_AUTH_STATE', {
    hasUser: Boolean(user),
    userId: user?.id ?? null,
    role: user?.role ?? null,
    onboardingStatus: user?.onboardingStatus ?? null,
    verificationStatus: user?.verificationStatus ?? null,
  });
  if (!user) {
    console.error('PENDING_REVIEW_AUTH_MISSING', {
      reason: 'no_current_user',
      redirectTo: '/register?error=session_not_found&from=pending-review',
    });
    redirect('/register?error=session_not_found&from=pending-review');
  }
  if (user && isAdminRole(user.role)) {
    if (user.role === 'female_admin') redirect('/admin/female');
    if (user.role === 'male_admin') redirect('/admin/male');
    redirect('/admin');
  }
  const femaleProfile = user?.gender === 'female' ? await getFemaleProfileByUserId(user.id) : null;
  const maleProfile = user?.gender === 'male' ? await getMaleProfileByUserId(user.id) : null;
  const supabase = await createServerSupabaseClient();
  const { data: identityDocument } = supabase
    ? await supabase.from('identity_documents').select('document_url,status').eq('user_id', user.id).maybeSingle()
    : { data: null };

  const hasIdentityDocument = Boolean(identityDocument?.document_url);
  const hasNurseDocument = Boolean(femaleProfile?.nurseDocumentUrl);
  const identityStatusLabel = !hasIdentityDocument ? '未提出' : (user.verificationStatus ?? 'pending');
  const nurseStatusLabel = !hasNurseDocument ? '未提出' : (femaleProfile?.nurseVerificationStatus ?? 'pending');

  return (
    <AppShell user={user}>
      <section className='space-y-4 rounded-[28px] border border-pink-100 bg-white p-6 shadow-sm'>
        <h1 className='text-2xl font-bold text-slate-900'>審査を行っています</h1>
        <p className='text-sm leading-7 text-slate-600'>
          現在、登録内容と確認書類を確認しています。
          <br />
          <br />
          本人確認・看護師確認の完了後、
          <br />
          メールにて結果をご案内します。
        </p>
        <p className='rounded-2xl border border-pink-100 bg-pink-50 px-4 py-3 text-sm text-slate-600'>
          承認後は、プロフィール編集・カード表示・マッチ機能などをご利用いただけます。
        </p>

        <div className='flex flex-wrap gap-2'>
          <Badge tone={identityStatusLabel === 'approved' ? 'green' : 'amber'}>本人確認: {identityStatusLabel}</Badge>
          {user?.gender === 'female' ? (
            <Badge tone={nurseStatusLabel === 'approved' ? 'pink' : 'amber'}>
              看護師確認: {nurseStatusLabel}
            </Badge>
          ) : null}
          {user?.gender === 'male' ? (
            <Badge tone={maleProfile?.maleReviewStatus === 'approved' ? 'green' : 'amber'}>
              男性審査: {maleProfile?.maleReviewStatus ?? 'pending'}
            </Badge>
          ) : null}
        </div>

        <div className='flex flex-wrap gap-2'>
          <form action={logoutAction}>
            <button className='inline-flex h-11 items-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700'>
              ログアウト
            </button>
          </form>
          <Link href='/' className='inline-flex h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white'>
            トップへ戻る
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
