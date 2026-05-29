import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/data';

type DatefiInterestRow = {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
  status: 'interested';
  users: {
    nickname: string;
    gender: 'female' | 'male';
    verification_status: 'pending' | 'approved' | 'rejected';
  } | null;
};

function isAllowedAdminEmail(email: string | undefined) {
  if (!email) return false;
  const allowList = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (allowList.length === 0) return false;
  return allowList.includes(email.toLowerCase());
}

export default async function AdminDatefiInterestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isAllowedAdminEmail(user.email)) redirect('/home');

  const adminSupabase = createAdminSupabaseClient();
  if (!adminSupabase) {
    return (
      <AppShell user={user}>
        <section className='rounded-3xl border border-slate-200 bg-white p-5 shadow-sm'>
          <h1 className='text-xl font-bold text-slate-900'>DateFi 関心登録一覧</h1>
          <p className='mt-3 text-sm text-slate-600'>管理者設定が未完了です。`SUPABASE_SERVICE_ROLE_KEY` を確認してください。</p>
        </section>
      </AppShell>
    );
  }

  const { data } = await adminSupabase
    .from('datefi_interests')
    .select(
      `
      id,
      user_id,
      email,
      created_at,
      status,
      users:user_id ( nickname, gender, verification_status )
    `,
    )
    .order('created_at', { ascending: false });

  const rows = (data as DatefiInterestRow[] | null) ?? [];

  return (
    <AppShell user={user}>
      <section className='space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm'>
        <h1 className='text-xl font-bold text-slate-900'>DateFi 関心登録一覧</h1>
        <p className='text-sm text-slate-600'>男性向け DateFi の関心登録状況を確認できます。</p>

        <div className='overflow-x-auto rounded-2xl border border-slate-200'>
          <table className='min-w-full divide-y divide-slate-200 text-sm'>
            <thead className='bg-slate-50 text-left text-xs text-slate-600'>
              <tr>
                <th className='px-3 py-2 font-medium'>登録日時</th>
                <th className='px-3 py-2 font-medium'>ユーザーID</th>
                <th className='px-3 py-2 font-medium'>メール</th>
                <th className='px-3 py-2 font-medium'>ニックネーム</th>
                <th className='px-3 py-2 font-medium'>性別</th>
                <th className='px-3 py-2 font-medium'>審査ステータス</th>
                <th className='px-3 py-2 font-medium'>status</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100 bg-white'>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className='px-3 py-2 text-slate-700'>{new Date(row.created_at).toLocaleString('ja-JP')}</td>
                  <td className='px-3 py-2 font-mono text-xs text-slate-600'>{row.user_id}</td>
                  <td className='px-3 py-2 text-slate-700'>{row.email}</td>
                  <td className='px-3 py-2 text-slate-700'>{row.users?.nickname ?? '-'}</td>
                  <td className='px-3 py-2 text-slate-700'>{row.users?.gender === 'female' ? '女性' : row.users?.gender === 'male' ? '男性' : '-'}</td>
                  <td className='px-3 py-2 text-slate-700'>{row.users?.verification_status ?? '-'}</td>
                  <td className='px-3 py-2 text-slate-700'>{row.status}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className='px-3 py-6 text-center text-slate-500'>
                    まだ関心登録はありません。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

