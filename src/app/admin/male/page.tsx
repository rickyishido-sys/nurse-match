import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Badge } from '@/components/badges';
import { adminMaleReviewAction, adminReportAction, adminRunRiskCheckAction, adminSuspendAction } from '@/lib/actions';
import { getAdminData, getCurrentUser } from '@/lib/data';

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function MaleAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  if (user.role !== 'male_admin' && user.role !== 'super_admin') redirect('/home');

  const data = await getAdminData(user.id);
  const males = data.users.filter((u) => u.gender === 'male');
  const maleReports = data.reports.filter((r) => males.some((u) => u.id === r.targetUserId));

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h1 className='text-lg font-bold text-slate-900'>男性管理</h1>
          <div className='mt-2 flex flex-wrap gap-2'>
            <Badge tone='amber'>男性審査待ち {males.filter((u) => data.maleProfiles.find((m) => m.userId === u.id)?.profile?.maleReviewStatus === 'pending').length}</Badge>
            <Badge tone='gray'>男性通報 {maleReports.length}</Badge>
          </div>
        </article>

        <article className='space-y-2 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h2 className='font-semibold text-slate-900'>男性ユーザー一覧</h2>
          {males.map((u) => {
            const mp = data.maleProfiles.find((m) => m.userId === u.id)?.profile;
            return (
              <div key={u.id} className='rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs'>
                <p className='font-semibold text-slate-900'>{u.nickname}</p>
                <p className='text-slate-600'>年収: {mp?.income ?? '-'} / 婚姻: {mp?.maritalStatus ?? '-'}</p>
                <p className='text-slate-600'>リスクチェック: {u.riskCheckStatus}</p>
                <div className='mt-2 flex flex-wrap gap-2'>
                  <form action={adminMaleReviewAction} className='flex gap-2'>
                    <input type='hidden' name='userId' value={u.id} />
                    <select name='status' defaultValue={mp?.maleReviewStatus ?? 'pending'} className='rounded-lg border border-slate-200 bg-white px-2 py-1'>
                      <option value='pending'>pending</option>
                      <option value='approved'>approved</option>
                      <option value='rejected'>rejected</option>
                    </select>
                    <input name='internalMemo' defaultValue={mp?.internalMemo ?? ''} placeholder='reason' className='rounded-lg border border-slate-200 bg-white px-2 py-1' />
                    <button className='rounded-lg bg-slate-900 px-2 py-1 text-white'>更新</button>
                  </form>
                  <form action={adminSuspendAction}>
                    <input type='hidden' name='userId' value={u.id} />
                    <input type='hidden' name='suspend' value={u.isSuspended ? 'false' : 'true'} />
                    <button className='rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-red-700'>{u.isSuspended ? '停止解除' : '停止'}</button>
                  </form>
                  <form action={adminRunRiskCheckAction}>
                    <input type='hidden' name='userId' value={u.id} />
                    <button className='rounded-lg border border-slate-300 bg-white px-2 py-1'>リスクチェック</button>
                  </form>
                </div>
              </div>
            );
          })}
        </article>

        <article className='space-y-2 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h2 className='font-semibold text-slate-900'>男性通報一覧</h2>
          {maleReports.map((r) => (
            <form key={r.id} action={adminReportAction} className='flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2 text-xs'>
              <input type='hidden' name='reportId' value={r.id} />
              <span className='flex-1'>{r.reason}</span>
              <select name='status' defaultValue={r.status} className='rounded-lg border border-slate-200 bg-white px-2 py-1'>
                <option value='open'>open</option>
                <option value='reviewing'>reviewing</option>
                <option value='resolved'>resolved</option>
                <option value='dismissed'>dismissed</option>
              </select>
              <button className='rounded-lg bg-slate-900 px-2 py-1 text-white'>更新</button>
            </form>
          ))}
        </article>
      </section>
    </AppShell>
  );
}
