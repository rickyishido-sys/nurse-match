import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { adminApproveReviewAction, adminRejectReviewAction } from '@/lib/actions';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/data';
import { getAdminSignedDocumentUrl } from '@/lib/storage';

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
  female_profiles: { nurse_document_url: string | null } | Array<{ nurse_document_url: string | null }> | null;
  male_profiles: { male_review_status: 'pending' | 'approved' | 'rejected' } | Array<{ male_review_status: 'pending' | 'approved' | 'rejected' }> | null;
};

function isAdminRole(role: string | undefined) {
  return role === 'female_admin' || role === 'male_admin' || role === 'super_admin';
}

function isRedirectThrown(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}

export default async function AdminReviewsPage() {
  const user = await getCurrentUser();
  if (!user) {
    console.log('ADMIN_PAGE_REDIRECT', { pathname: '/admin/reviews', role: null, redirectTo: '/login', queryName: 'auth_guard' });
    redirect('/login');
  }
  if (!isAdminRole(user.role)) {
    console.log('ADMIN_PAGE_REDIRECT', { pathname: '/admin/reviews', role: user.role, redirectTo: '/home', queryName: 'role_guard' });
    redirect('/home');
  }

  try {
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

    const { data: pendingUsers, error: pendingUsersError } = await adminSupabase
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
    if (pendingUsersError) {
      console.error('ADMIN_QUERY_ERROR', {
        pathname: '/admin/reviews',
        role: user.role,
        queryName: 'pending_reviews_list',
        tableName: 'users',
        message: pendingUsersError.message,
      });
      throw pendingUsersError;
    }

    const reviewRows = await Promise.all(
      ((pendingUsers as PendingReviewRow[] | null) ?? []).map(async (entry) => {
        const femaleDoc = Array.isArray(entry.female_profiles)
          ? entry.female_profiles[0]?.nurse_document_url
          : entry.female_profiles?.nurse_document_url;
        const [profileImageUrl, identityDocumentUrl, nurseDocumentUrl] = await Promise.all([
          getAdminSignedDocumentUrl(entry.profile_image_url, true),
          getAdminSignedDocumentUrl(entry.identity_document_url, true),
          getAdminSignedDocumentUrl(femaleDoc ?? null, true),
        ]);
        return { entry, profileImageUrl, identityDocumentUrl, nurseDocumentUrl };
      }),
    );

    return (
      <AppShell user={user}>
        <section className='space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm'>
        <h1 className='text-xl font-bold text-slate-900'>審査待ちユーザー一覧</h1>
        <p className='text-sm text-slate-600'>登録内容を確認し、承認または否認を行ってください。</p>

        <div className='space-y-3'>
          {reviewRows.map(({ entry, profileImageUrl, identityDocumentUrl, nurseDocumentUrl }) => {
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
                  {profileImageUrl ? (
                    <a href={profileImageUrl} target='_blank' rel='noreferrer' className='rounded-lg border border-slate-300 bg-white px-2 py-1'>
                      プロフィール画像
                    </a>
                  ) : (
                    <span className='rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-amber-700'>プロフィール画像: 未提出</span>
                  )}
                  {identityDocumentUrl ? (
                    <a href={identityDocumentUrl} target='_blank' rel='noreferrer' className='rounded-lg border border-slate-300 bg-white px-2 py-1'>
                      本人確認書類
                    </a>
                  ) : (
                    <span className='rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-amber-700'>本人確認書類: 未提出</span>
                  )}
                  {entry.gender === 'female' ? (
                    nurseDocumentUrl ? (
                      <a href={nurseDocumentUrl} target='_blank' rel='noreferrer' className='rounded-lg border border-slate-300 bg-white px-2 py-1'>
                        看護師確認書類
                      </a>
                    ) : (
                      <span className='rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-amber-700'>看護師確認書類: 未提出</span>
                    )
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
  } catch (error) {
    if (isRedirectThrown(error)) throw error;
    console.error('ADMIN_PAGE_ERROR', {
      page: '/admin/reviews',
      pathname: '/admin/reviews',
      queryName: 'page_render',
      userId: user.id,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
    return (
      <AppShell user={user}>
        <section className='rounded-3xl border border-red-100 bg-white p-5 shadow-sm'>
          <h1 className='text-xl font-bold text-slate-900'>審査管理</h1>
          <p className='mt-3 text-sm text-red-700'>審査ページの読み込み中にエラーが発生しました。時間をおいて再度お試しください。</p>
        </section>
      </AppShell>
    );
  }
}

