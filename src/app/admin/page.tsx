import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Badge } from '@/components/badges';
import {
  adminMatchHoldDeletionAction,
  adminMaleReviewAction,
  adminModerationAction,
  adminNurseAction,
  adminReportAction,
  adminRiskCheckUpdateAction,
  adminRunRiskCheckAction,
  adminSuspendAction,
  adminVerificationAction,
} from '@/lib/actions';
import { getAdminMetrics } from '@/lib/admin-metrics';
import { getAdminData, getCurrentUser } from '@/lib/data';
import { maritalStatusLabel } from '@/lib/labels';

export const metadata = {
  robots: { index: false, follow: false },
};

function statusTone(status: string): 'amber' | 'green' | 'gray' {
  if (status === 'approved' || status === 'resolved') return 'green';
  if (status === 'pending' || status === 'open' || status === 'reviewing') return 'amber';
  return 'gray';
}

function riskTone(status: string): 'amber' | 'green' | 'gray' {
  if (status === 'clear') return 'green';
  if (status === 'review_required' || status === 'checking' || status === 'not_checked') return 'amber';
  return 'gray';
}

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

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'super_admin') redirect('/home');

  const data = await getAdminData(user.id);
  const metrics = await getAdminMetrics('all');
  const pendingCount = data.users.filter((u) => u.verificationStatus === 'pending').length;
  const userMap = new Map(data.users.map((u) => [u.id, u.nickname]));

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <article className='rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm'>
          <h1 className='text-xl font-bold text-slate-900'>管理画面</h1>
          <div className='mt-3 flex flex-wrap gap-2'>
            <Badge tone='amber'>審査待ち {pendingCount}</Badge>
            <Badge tone='gray'>通報件数 {data.reports.length}</Badge>
            <Badge tone='navy'>監査ログ {data.adminActions.length}</Badge>
          </div>
        </article>

        <article className='space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h2 className='font-semibold text-slate-900'>1. 利用者数</h2>
          <div className='grid grid-cols-2 gap-2 md:grid-cols-4'>
            <KpiCard label='総登録者数' value={metrics.userCounts.total} />
            <KpiCard label='女性登録者数' value={metrics.userCounts.female} />
            <KpiCard label='男性登録者数' value={metrics.userCounts.male} />
            <KpiCard label='仮登録数' value={metrics.userCounts.provisional} />
            <KpiCard label='本人確認済み数' value={metrics.userCounts.verified} />
            <KpiCard label='看護師確認済み女性数' value={metrics.userCounts.nurseApprovedFemale} />
            <KpiCard label='男性審査通過数' value={metrics.userCounts.maleReviewApproved} />
            <KpiCard label='停止中ユーザー数' value={metrics.userCounts.suspended} />
          </div>
        </article>

        <article className='space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h2 className='font-semibold text-slate-900'>2. マッチング数</h2>
          <div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
            <KpiCard label='累計マッチ数' value={metrics.matching.totalMatches} />
            <KpiCard label='今日のマッチ数' value={metrics.matching.todayMatches} />
            <KpiCard label='直近7日マッチ数' value={metrics.matching.sevenDayMatches} />
            <KpiCard label='メッセージ送信数' value={metrics.matching.messageCount} />
            <KpiCard label='relationship_mode 数' value={metrics.matching.relationshipMode} />
            <KpiCard label='scheduled_delete 数' value={metrics.matching.scheduledDelete} />
          </div>
        </article>

        <article className='space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h2 className='font-semibold text-slate-900'>3. 登録者属性</h2>
          <div className='grid gap-3 md:grid-cols-2'>
            <div className='rounded-2xl border border-slate-100 bg-slate-50 p-3'><p className='mb-2 text-xs font-semibold text-slate-700'>性別比率</p><DistList items={metrics.attributes.genderRatio} /></div>
            <div className='rounded-2xl border border-slate-100 bg-slate-50 p-3'><p className='mb-2 text-xs font-semibold text-slate-700'>年齢帯</p><DistList items={metrics.attributes.ageBands} /></div>
            <div className='rounded-2xl border border-slate-100 bg-slate-50 p-3'><p className='mb-2 text-xs font-semibold text-slate-700'>居住地</p><DistList items={metrics.attributes.locations} /></div>
            <div className='rounded-2xl border border-slate-100 bg-slate-50 p-3'><p className='mb-2 text-xs font-semibold text-slate-700'>男性の職種</p><DistList items={metrics.attributes.maleJobs} /></div>
            <div className='rounded-2xl border border-slate-100 bg-slate-50 p-3'><p className='mb-2 text-xs font-semibold text-slate-700'>男性の年収帯</p><DistList items={metrics.attributes.maleIncomeBands} /></div>
            <div className='rounded-2xl border border-slate-100 bg-slate-50 p-3'><p className='mb-2 text-xs font-semibold text-slate-700'>男性の婚姻状態</p><DistList items={metrics.attributes.maleMaritalStatus} /></div>
            <div className='rounded-2xl border border-slate-100 bg-slate-50 p-3'><p className='mb-2 text-xs font-semibold text-slate-700'>女性の勤務形態</p><DistList items={metrics.attributes.femaleWorkplaceType} /></div>
            <div className='rounded-2xl border border-slate-100 bg-slate-50 p-3'><p className='mb-2 text-xs font-semibold text-slate-700'>夜勤有無</p><DistList items={metrics.attributes.femaleNightShift} /></div>
          </div>
        </article>

        <article className='space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h2 className='font-semibold text-slate-900'>4. 審査状況</h2>
          <div className='grid grid-cols-2 gap-2 md:grid-cols-4'>
            <KpiCard label='本人確認 pending' value={metrics.reviews.verification.pending} />
            <KpiCard label='本人確認 approved' value={metrics.reviews.verification.approved} />
            <KpiCard label='本人確認 rejected' value={metrics.reviews.verification.rejected} />
            <KpiCard label='看護師確認 pending' value={metrics.reviews.nurse.pending} />
            <KpiCard label='看護師確認 approved' value={metrics.reviews.nurse.approved} />
            <KpiCard label='看護師確認 rejected' value={metrics.reviews.nurse.rejected} />
            <KpiCard label='男性審査 pending' value={metrics.reviews.maleReview.pending} />
            <KpiCard label='男性審査 approved' value={metrics.reviews.maleReview.approved} />
            <KpiCard label='男性審査 rejected' value={metrics.reviews.maleReview.rejected} />
            <KpiCard label='写真審査 pending' value={metrics.reviews.photo.pending} />
            <KpiCard label='写真審査 approved' value={metrics.reviews.photo.approved} />
            <KpiCard label='写真審査 rejected' value={metrics.reviews.photo.rejected} />
          </div>
          <div className='rounded-2xl border border-slate-100 bg-slate-50 p-3'>
            <p className='mb-2 text-xs font-semibold text-slate-700'>riskCheckStatus 別件数</p>
            <DistList items={metrics.reviews.riskCheck} />
          </div>
        </article>

        <article className='space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h2 className='font-semibold text-slate-900'>5. 通報・安全性</h2>
          <div className='grid grid-cols-2 gap-2 md:grid-cols-5'>
            <KpiCard label='未対応通報数' value={metrics.safety.reportOpen} />
            <KpiCard label='reviewing 通報数' value={metrics.safety.reportReviewing} />
            <KpiCard label='resolved 通報数' value={metrics.safety.reportResolved} />
            <KpiCard label='ブロック数' value={metrics.safety.blockCount} />
            <KpiCard label='permanent_ban 数' value={metrics.safety.permanentBanCount} />
          </div>
        </article>

        <article className='space-y-2 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h2 className='font-semibold text-slate-900'>6. 入金・課金</h2>
          <div className='grid grid-cols-2 gap-2 md:grid-cols-5'>
            <KpiCard label='interest_signals数' value={metrics.economy.interestSignals} />
            <KpiCard label='favorites数' value={metrics.economy.favorites} />
            <KpiCard label='課金数(purchase)' value={metrics.economy.paymentCount} />
            <KpiCard label='クレジット消費量' value={metrics.economy.creditConsumption} />
            <KpiCard label='累計マッチ数' value={metrics.matching.totalMatches} />
          </div>
          <p className='text-xs text-slate-500'>クレジット制KPIを反映中。決済連携後に売上指標を拡張します。</p>
        </article>

        <div className='space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h2 className='font-semibold text-slate-900'>審査対象ユーザー</h2>
          {data.users.map((u) => {
            const female = data.femaleProfiles.find((f) => f.userId === u.id)?.profile;
            const male = data.maleProfiles.find((m) => m.userId === u.id)?.profile;

            return (
              <article key={u.id} className='rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-xs'>
                <div className='mb-2 flex flex-wrap items-center gap-2'>
                  <p className='font-semibold text-slate-900'>{u.nickname} ({u.gender}/{u.role})</p>
                  <Badge tone={statusTone(u.verificationStatus)}>本人 {u.verificationStatus}</Badge>
                  <Badge tone={riskTone(u.riskCheckStatus)}>リスク {u.riskCheckStatus}</Badge>
                  {male ? <Badge tone={statusTone(male.maleReviewStatus)}>男性審査 {male.maleReviewStatus}</Badge> : null}
                  {female ? <Badge tone={statusTone(female.nurseVerificationStatus)}>看護師確認 {female.nurseVerificationStatus}</Badge> : null}
                </div>

                <p>{u.email}</p>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {u.identityDocumentUrl ? (
                    <a href={u.identityDocumentUrl} target='_blank' rel='noreferrer' className='rounded-lg border border-slate-200 bg-white px-2 py-1'>
                      本人書類確認
                    </a>
                  ) : (
                    <span className='rounded-lg border border-slate-200 bg-white px-2 py-1'>本人書類なし</span>
                  )}
                  {u.gender === 'female' && female?.nurseDocumentUrl ? (
                    <a href={female.nurseDocumentUrl} target='_blank' rel='noreferrer' className='rounded-lg border border-slate-200 bg-white px-2 py-1'>
                      看護師書類確認
                    </a>
                  ) : null}
                </div>

                {u.gender === 'male' ? (
                  <p className='mt-2'>職種 {male?.job} / 年収 {male?.income} / 婚姻 {male ? maritalStatusLabel(male.maritalStatus) : '-'}</p>
                ) : null}

                <div className='mt-3 grid grid-cols-1 gap-2'>
                  <form action={adminVerificationAction} className='flex flex-wrap gap-2'>
                    <input type='hidden' name='userId' value={u.id} />
                    <select name='status' defaultValue={u.verificationStatus} className='rounded-lg border border-slate-200 bg-white px-2 py-1'>
                      <option value='pending'>pending</option>
                      <option value='approved'>approved</option>
                      <option value='rejected'>rejected</option>
                    </select>
                    <input name='rejectedReason' defaultValue={u.rejectedReason ?? ''} placeholder='rejected reason' className='rounded-lg border border-slate-200 bg-white px-2 py-1' />
                    <button className='rounded-lg bg-slate-900 px-2 py-1 text-white'>本人確認更新</button>
                  </form>
                  <form action={adminRunRiskCheckAction}>
                    <input type='hidden' name='userId' value={u.id} />
                    <button className='rounded-lg border border-slate-300 bg-white px-2 py-1'>リスクチェック実行</button>
                  </form>

                  {u.gender === 'female' ? (
                    <form action={adminNurseAction} className='flex gap-2'>
                      <input type='hidden' name='userId' value={u.id} />
                      <select name='status' defaultValue={female?.nurseVerificationStatus} className='rounded-lg border border-slate-200 bg-white px-2 py-1'>
                        <option value='pending'>pending</option>
                        <option value='approved'>approved</option>
                        <option value='rejected'>rejected</option>
                      </select>
                      <button className='rounded-lg bg-pink-600 px-2 py-1 text-white'>看護師確認更新</button>
                    </form>
                  ) : null}

                  {u.gender === 'male' ? (
                    <form action={adminMaleReviewAction} className='flex flex-wrap gap-2'>
                      <input type='hidden' name='userId' value={u.id} />
                      <select name='status' defaultValue={male?.maleReviewStatus ?? 'pending'} className='rounded-lg border border-slate-200 bg-white px-2 py-1'>
                        <option value='pending'>pending</option>
                        <option value='approved'>approved</option>
                        <option value='rejected'>rejected</option>
                      </select>
                      <input name='internalMemo' defaultValue={male?.internalMemo ?? ''} placeholder='internal memo' className='rounded-lg border border-slate-200 bg-white px-2 py-1' />
                      <button className='rounded-lg bg-indigo-600 px-2 py-1 text-white'>男性審査更新</button>
                    </form>
                  ) : null}

                  <form action={adminModerationAction} className='flex flex-wrap gap-2'>
                    <input type='hidden' name='userId' value={u.id} />
                    <select name='moderationAction' defaultValue={u.moderationAction} className='rounded-lg border border-slate-200 bg-white px-2 py-1'>
                      <option value='none'>none</option>
                      <option value='warning'>warning</option>
                      <option value='suspend'>suspend</option>
                      <option value='permanent_ban'>permanent_ban</option>
                    </select>
                    <input name='rejectedReason' defaultValue={u.rejectedReason ?? ''} placeholder='memo/reason' className='rounded-lg border border-slate-200 bg-white px-2 py-1' />
                    <button className='rounded-lg border border-slate-300 bg-white px-2 py-1'>moderation更新</button>
                  </form>

                  <form action={adminSuspendAction} className='flex gap-2'>
                    <input type='hidden' name='userId' value={u.id} />
                    <input type='hidden' name='suspend' value={u.isSuspended ? 'false' : 'true'} />
                    <button className='rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-red-700'>
                      {u.isSuspended ? '停止解除' : '停止 / 永久停止'}
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>

        <div className='space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h2 className='font-semibold text-slate-900'>通報一覧</h2>
          {data.reports.map((report) => (
            <article key={report.id} className='rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-xs'>
              <p className='font-semibold text-slate-800'>理由: {report.reason}</p>
              <p className='text-slate-600'>reasonType: {report.reasonType}</p>
              <p className='mb-2 text-slate-600'>{report.detail}</p>
              <form action={adminReportAction} className='flex gap-2'>
                <input type='hidden' name='reportId' value={report.id} />
                <select name='status' defaultValue={report.status} className='rounded-lg border border-slate-200 bg-white px-2 py-1'>
                  <option value='open'>open</option>
                  <option value='reviewing'>reviewing</option>
                  <option value='resolved'>resolved</option>
                  <option value='dismissed'>dismissed</option>
                </select>
                <button className='rounded-lg bg-slate-900 px-2 py-1 text-white'>更新</button>
              </form>
            </article>
          ))}
        </div>

        <div className='space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h2 className='font-semibold text-slate-900'>リスクチェック詳細</h2>
          {data.riskChecks.filter((r): r is NonNullable<typeof r> => Boolean(r)).length === 0 ? (
            <p className='text-xs text-slate-500'>リスクチェック履歴はありません。</p>
          ) : (
            data.riskChecks
              .filter((r): r is NonNullable<typeof r> => Boolean(r))
              .map((risk) => (
              <article key={risk.id} className='rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-xs'>
                <p className='font-semibold text-slate-900'>{userMap.get(risk.userId) ?? risk.userId}</p>
                <p className='text-slate-600'>検索日時: {new Date(risk.searchedAt).toLocaleString('ja-JP')}</p>
                <p className='text-slate-600'>ヒット件数: {risk.hitCount}</p>
                <p className='text-slate-600'>status: {risk.status}</p>
                <p className='text-slate-600'>最終判断者: {risk.finalDeciderId ? userMap.get(risk.finalDeciderId) ?? risk.finalDeciderId : '-'}</p>
                <p className='text-slate-600'>判断日時: {risk.decidedAt ? new Date(risk.decidedAt).toLocaleString('ja-JP') : '-'}</p>
                <p className='mt-1 text-slate-600'>検索キーワード: {risk.searchKeywords.length > 0 ? risk.searchKeywords.join(' / ') : '-'}</p>
                <div className='mt-1 space-y-1'>
                  {(risk.sourceUrls ?? []).length === 0 ? (
                    <p className='text-slate-500'>参照URLなし</p>
                  ) : (
                    risk.sourceUrls.map((url: string) => (
                      <a key={url} href={url} target='_blank' rel='noreferrer' className='block truncate text-blue-600 underline'>
                        {url}
                      </a>
                    ))
                  )}
                </div>
                <p className='mt-2 rounded-lg bg-white px-2 py-1 text-slate-600'>
                  AIは反社確定判定をしません。公開情報の確認候補として扱い、最終判断は管理者が行います。
                </p>
                <form action={adminRiskCheckUpdateAction} className='mt-2 flex flex-wrap gap-2'>
                  <input type='hidden' name='userId' value={risk.userId} />
                  <select name='status' defaultValue={risk.status} className='rounded-lg border border-slate-200 bg-white px-2 py-1'>
                    <option value='clear'>clear</option>
                    <option value='review_required'>review_required</option>
                    <option value='rejected'>rejected</option>
                  </select>
                  <input
                    name='adminMemo'
                    defaultValue={risk.adminMemo ?? ''}
                    placeholder='管理者メモ'
                    className='min-w-[220px] flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1'
                  />
                  <button className='rounded-lg bg-slate-900 px-2 py-1 text-white'>更新</button>
                </form>
              </article>
            ))
          )}
        </div>

        <div className='space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h2 className='font-semibold text-slate-900'>関係成立 / 削除予定</h2>
          {data.relationshipMatches.length === 0 ? (
            <p className='text-xs text-slate-500'>relationship_mode のマッチはありません。</p>
          ) : (
            data.relationshipMatches.map((match) => (
              <article key={match.id} className='rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-xs'>
                <p className='font-semibold text-slate-800'>
                  {userMap.get(match.userAId) ?? match.userAId} × {userMap.get(match.userBId) ?? match.userBId}
                </p>
                <p className='text-slate-600'>status: {match.relationshipStatus}</p>
                <p className='text-slate-600'>relationshipStartedAt: {match.relationshipStartedAt ?? '-'}</p>
                <p className='text-slate-600'>scheduledDeleteAt: {match.scheduledDeleteAt ?? '-'}</p>
                <form action={adminMatchHoldDeletionAction} className='mt-2 flex items-center gap-2'>
                  <input type='hidden' name='matchId' value={match.id} />
                  <input type='hidden' name='holdDeletion' value={match.holdDeletion ? 'false' : 'true'} />
                  <button className='rounded-lg border border-slate-300 bg-white px-2 py-1'>
                    {match.holdDeletion ? '削除保留を解除' : '削除保留にする'}
                  </button>
                  <Badge tone={match.holdDeletion ? 'amber' : 'gray'}>{match.holdDeletion ? 'holdDeletion: true' : 'holdDeletion: false'}</Badge>
                </form>
              </article>
            ))
          )}
        </div>

        <div className='space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
          <h2 className='font-semibold text-slate-900'>監査ログ</h2>
          {data.adminActions.length === 0 ? (
            <p className='text-xs text-slate-500'>ログはまだありません。</p>
          ) : (
            <ul className='space-y-2 text-xs'>
              {data.adminActions.map((log) => (
                <li key={log.id} className='rounded-xl border border-slate-100 bg-slate-50 p-3'>
                  <p className='font-semibold text-slate-800'>{log.actionType}</p>
                  <p className='text-slate-600'>admin: {log.adminUserId} / target: {log.targetUserId}</p>
                  <p className='text-slate-500'>before: {log.beforeValue ?? '-'} / after: {log.afterValue ?? '-'}</p>
                  {log.note ? <p className='text-slate-500'>note: {log.note}</p> : null}
                  <p className='text-slate-400'>{new Date(log.createdAt).toLocaleString('ja-JP')}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </AppShell>
  );
}
