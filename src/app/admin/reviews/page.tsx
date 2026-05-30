import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { adminApproveReviewAction, adminRejectReviewAction } from '@/lib/actions';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/data';

type PendingReviewRow = {
  id: string;
  created_at: string;
  email: string;
  nickname: string;
  gender: 'female' | 'male';
  birthdate: string;
  location: string;
  desired_gender: 'male' | 'female' | 'both';
  profile_image_url: string | null;
  identity_document_url: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  rejected_reason: string | null;
  female_profiles: { nurse_document_url: string | null } | null;
  male_profiles: { male_review_status: 'pending' | 'approved' | 'rejected' } | null;
};

function isAdminRole(role: string | undefined) {
  return role === 'female_admin' || role === 'male_admin' || role === 'super_admin';
}

export default async function AdminReviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isAdminRole(user.role)) redirect('/home');

  const adminSupabase = createAdminSupabaseClient();
  if (!adminSupabase) {
    return (
      <AppShell user={user}>
        <section className='rounded-3xl border border-slate-200 bg-white p-5 shadow-sm'>
          <h1 className='text-xl font-bold text-slate-900'>審査管理</h1>
          <p className='mt-3 text-sm text-slate-600'>管理者設定が未完了です。`SUPABASE_SERVICE_ROLE_KEY` を確認してください。</p>
        </section>
      </AppShell>
    );
  }

  const { data: pendingUsers } = await adminSupabase
    .from('users')
    .select(`
      id,
      created_at,
      email,
      nickname,
      gender,
      birthdate,
      location,
      desired_gender,
      profile_image_url,
      identity_document_url,
      verification_status,
      rejected_reason,
      female_profiles:user_id ( nurse_document_url ),
      male_profiles:user_id ( male_review_status )
    `)
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true });

  return (
    <AppShell user={user}>
      <section className='space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm'>
        <h1 className='text-xl font-bold text-slate-900'>審査待ちユーザー一覧</h1>
        <p className='text-sm text-slate-600'>登録内容を確認し、承認または否認を行ってください。</p>

        <div className='space-y-3'>
          {(pendingUsers as PendingReviewRow[] | null ?? []).map((entry) => {
            const femaleDoc = entry.female_profiles?.nurse_document_url as string | null | undefined;
            return (
              <article key={entry.id} className='rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm'>
                <div className='grid gap-1 text-slate-700 md:grid-cols-2'>
                  <p>登録日時: {new Date(entry.created_at).toLocaleString('ja-JP')}</p>
                  <p>メール: {entry.email}</p>
                  <p>ニックネーム: {entry.nickname}</p>
                  <p>性別: {entry.gender === 'female' ? '女性' : '男性'}</p>
                  <p>生年月日: {entry.birthdate}</p>
                  <p>居住地: {entry.location}</p>
                  <p>出会いたい相手: {entry.desired_gender}</p>
                  <p>現在ステータス: {entry.verification_status}</p>
                </div>

                <div className='mt-3 flex flex-wrap gap-2 text-xs'>
                  {entry.profile_image_url ? (
                    <a href={entry.profile_image_url} target='_blank' rel='noreferrer' className='rounded-lg border border-slate-300 bg-white px-2 py-1'>
                      プロフィール画像
                    </a>
                  ) : null}
                  {entry.identity_document_url ? (
                    <a href={entry.identity_document_url} target='_blank' rel='noreferrer' className='rounded-lg border border-slate-300 bg-white px-2 py-1'>
                      本人確認書類
                    </a>
                  ) : null}
                  {entry.gender === 'female' && femaleDoc ? (
                    <a href={femaleDoc} target='_blank' rel='noreferrer' className='rounded-lg border border-slate-300 bg-white px-2 py-1'>
                      看護師確認書類
                    </a>
                  ) : null}
                </div>

                <div className='mt-3 flex flex-wrap gap-2'>
                  <form action={adminApproveReviewAction}>
                    <input type='hidden' name='userId' value={entry.id} />
                    <button className='rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white'>承認する</button>
                  </form>
                </div>

                <form action={adminRejectReviewAction} className='mt-2 space-y-2'>
                  <input type='hidden' name='userId' value={entry.id} />
                  <textarea
                    name='reason'
                    required
                    rows={3}
                    placeholder='否認理由を入力してください（例: 本人確認書類が不鮮明です）'
                    className='w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs'
                  />
                  <button className='rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700'>否認する</button>
                </form>
              </article>
            );
          })}
          {(pendingUsers?.length ?? 0) === 0 ? (
            <p className='rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600'>審査待ちユーザーはいません。</p>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}

