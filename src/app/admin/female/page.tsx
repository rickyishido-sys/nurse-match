import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Badge } from '@/components/badges';
import { adminNurseAction, adminReportAction, adminRiskCheckUpdateAction, adminRunRiskCheckAction, adminSuspendAction } from '@/lib/actions';
import { getAdminMetrics } from '@/lib/admin-metrics';
import { getAdminData, getCurrentUser } from '@/lib/data';

export const metadata = {
  robots: { index: false, follow: false },
};

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className='rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-blue-50/30 p-3'>
      <p className='text-[11px] text-slate-500'>{label}</p>
      <p className='mt-1 text-2xl font-bold text-slate-900'>{value}</p>
    </article>
  );
}

function DistList({ items }: { items: Array<{ label: string; count: number }> }) {
  if (items.length === 0) return <p className='text-xs text-slate-500'>データなし</p>;
  return (
    <ul className='space-y-1 text-xs'>
      {items.slice(0, 6).map((item) => (
        <li key={item.label} className='flex items-center justify-between'>
          <span className='text-slate-600'>{item.label}</span>
          <span className='font-semibold text-slate-900'>{item.count}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function FemaleAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  if (user.role !== 'female_admin' && user.role !== 'super_admin') redirect('/home');

  const data = await getAdminData(user.id);
  const metrics = await getAdminMetrics('female');
  const females = data.users.filter((u) => u.gender === 'female');
  const femaleReports = data.reports.filter((r) => females.some((u) => u.id === r.targetUserId));
  const femaleRiskChecks = data.riskChecks.filter((r): r is NonNullable<typeof r> => Boolean(r)).filter((r) => females.some((u) => u.id === r.userId));
  const femaleMap = new Map(females.map((u) => [u.id, u.nickname]));

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h1 className='text-lg font-bold text-slate-900'>女性管理</h1>
          <div className='mt-2 flex flex-wrap gap-2'>
            <Badge tone='amber'>看護師確認待ち {females.filter((u) => data.femaleProfiles.find((f) => f.userId === u.id)?.profile?.nurseVerificationStatus === 'pending').length}</Badge>
            <Badge tone='gray'>女性通報 {femaleReports.length}</Badge>
          </div>
        </article>

        <article className='space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h2 className='font-semibold text-slate-900'>女性管理KPI</h2>
          <div className='grid grid-cols-2 gap-2 md:grid-cols-4'>
            <KpiCard label='女性登録数' value={metrics.userCounts.female} />
            <KpiCard label='仮登録数' value={metrics.userCounts.provisional} />
            <KpiCard label='本人確認済み数' value={metrics.userCounts.verified} />
            <KpiCard label='看護師確認済み女性数' value={metrics.userCounts.nurseApprovedFemale} />
            <KpiCard label='女性通報 open' value={metrics.safety.reportOpen} />
            <KpiCard label='女性通報 reviewing' value={metrics.safety.reportReviewing} />
            <KpiCard label='女性通報 resolved' value={metrics.safety.reportResolved} />
            <KpiCard label='女性写真審査 pending' value={metrics.reviews.photo.pending} />
          </div>
          <div className='grid gap-3 md:grid-cols-3'>
            <div className='rounded-2xl border border-slate-100 bg-slate-50 p-3'><p className='mb-2 text-xs font-semibold text-slate-700'>女性の勤務形態</p><DistList items={metrics.attributes.femaleWorkplaceType} /></div>
            <div className='rounded-2xl border border-slate-100 bg-slate-50 p-3'><p className='mb-2 text-xs font-semibold text-slate-700'>夜勤有無</p><DistList items={metrics.attributes.femaleNightShift} /></div>
            <div className='rounded-2xl border border-slate-100 bg-slate-50 p-3'><p className='mb-2 text-xs font-semibold text-slate-700'>riskCheckStatus</p><DistList items={metrics.reviews.riskCheck} /></div>
          </div>
        </article>

        <article className='space-y-2 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h2 className='font-semibold text-slate-900'>女性ユーザー一覧</h2>
          {females.map((u) => {
            const fp = data.femaleProfiles.find((f) => f.userId === u.id)?.profile;
            return (
              <div key={u.id} className='rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs'>
                <p className='font-semibold text-slate-900'>{u.nickname}</p>
                <p className='text-slate-600'>看護師確認: {fp?.nurseVerificationStatus ?? 'pending'}</p>
                <p className='text-slate-600'>リスクチェック: {u.riskCheckStatus}</p>
                <div className='mt-2 flex flex-wrap gap-2'>
                  <form action={adminNurseAction} className='flex gap-2'>
                    <input type='hidden' name='userId' value={u.id} />
                    <select name='status' defaultValue={fp?.nurseVerificationStatus ?? 'pending'} className='rounded-lg border border-slate-200 bg-white px-2 py-1'>
                      <option value='pending'>pending</option>
                      <option value='approved'>approved</option>
                      <option value='rejected'>rejected</option>
                    </select>
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
          <h2 className='font-semibold text-slate-900'>女性通報一覧</h2>
          {femaleReports.map((r) => (
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

        <article className='space-y-2 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h2 className='font-semibold text-slate-900'>女性リスクチェック詳細</h2>
          {femaleRiskChecks.map((risk) => (
            <div key={risk.id} className='rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs'>
              <p className='font-semibold text-slate-900'>{femaleMap.get(risk.userId) ?? risk.userId}</p>
              <p className='text-slate-600'>検索日時: {new Date(risk.searchedAt).toLocaleString('ja-JP')}</p>
              <p className='text-slate-600'>検索キーワード: {risk.searchKeywords.join(' / ') || '-'}</p>
              <p className='text-slate-600'>ヒット件数: {risk.hitCount}</p>
              <div className='space-y-1'>
                {(risk.sourceUrls ?? []).map((url: string) => (
                  <a key={url} href={url} target='_blank' rel='noreferrer' className='block truncate text-blue-600 underline'>
                    {url}
                  </a>
                ))}
              </div>
              <p className='text-slate-600'>status: {risk.status}</p>
              <p className='text-slate-600'>最終判断者: {risk.finalDeciderId ? femaleMap.get(risk.finalDeciderId) ?? risk.finalDeciderId : '-'}</p>
              <p className='text-slate-600'>判断日時: {risk.decidedAt ? new Date(risk.decidedAt).toLocaleString('ja-JP') : '-'}</p>
              <form action={adminRiskCheckUpdateAction} className='mt-2 flex flex-wrap gap-2'>
                <input type='hidden' name='userId' value={risk.userId} />
                <select name='status' defaultValue={risk.status} className='rounded-lg border border-slate-200 bg-white px-2 py-1'>
                  <option value='clear'>clear</option>
                  <option value='review_required'>review_required</option>
                  <option value='rejected'>rejected</option>
                </select>
                <input name='adminMemo' defaultValue={risk.adminMemo ?? ''} placeholder='管理者メモ' className='flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1' />
                <button className='rounded-lg bg-slate-900 px-2 py-1 text-white'>更新</button>
              </form>
            </div>
          ))}
        </article>
      </section>
    </AppShell>
  );
}
