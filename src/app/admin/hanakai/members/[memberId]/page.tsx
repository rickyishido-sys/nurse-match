import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminPageHeader, Badge } from '@/components/admin/ui';
import { AdminEmptyState, formatAdminDate } from '@/components/admin/hanakai/hanakai-admin-shared';
import { getHanakaiAdminMemberDetail } from '@/lib/connection/hanakai-admin-repo';

type PageProps = { params: Promise<{ memberId: string }> };

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  const display = value === null || value === undefined || value === '' ? '未入力' : String(value);
  return (
    <div>
      <dt className='text-[11px] text-[#9a9a9a]'>{label}</dt>
      <dd className='mt-0.5 text-sm text-[#1a1a1a] whitespace-pre-wrap'>{display}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='rounded-2xl border border-[#ebe7dd] bg-white p-5'>
      <h2 className='mb-4 text-sm font-semibold text-[#1a1a1a]'>{title}</h2>
      {children}
    </section>
  );
}

const statusTone = {
  active: 'green' as const,
  warning: 'amber' as const,
  suspended: 'redSoft' as const,
  deleted: 'gray' as const,
};

export default async function HanakaiAdminMemberDetailPage({ params }: PageProps) {
  const { memberId } = await params;
  const detail = await getHanakaiAdminMemberDetail(memberId);
  if (!detail) notFound();

  const { member } = detail;

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <AdminPageHeader
          kicker='MEMBER DETAIL'
          title={member.nickname}
          description='会員プロフィールと活動履歴の確認'
        />
        <Link
          href='/admin/hanakai/members'
          className='rounded-full border border-[#e2ddd2] bg-white px-4 py-2 text-xs font-medium text-[#6b6b6b] hover:text-[#1a1a1a]'
        >
          ← 会員一覧
        </Link>
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        <div className='space-y-6'>
          <Section title='基本情報'>
            <div className='flex items-start gap-4'>
              {member.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.avatarUrl} alt='' className='h-20 w-20 rounded-2xl object-cover' />
              ) : (
                <div className='flex h-20 w-20 items-center justify-center rounded-2xl bg-[#eef3ef] text-2xl text-[#1f5d4f]'>
                  {member.nickname.slice(0, 1)}
                </div>
              )}
              <dl className='grid flex-1 gap-3 sm:grid-cols-2'>
                <Field label='ニックネーム' value={member.nickname} />
                <Field label='年齢' value={member.age ? `${member.age}歳` : null} />
                <Field label='性別' value={member.genderLabel} />
                <Field label='居住エリア' value={member.area} />
                <Field label='ライフフェーズ' value={member.lifePhaseLabel} />
                <Field label='職業' value={detail.occupation} />
                <Field label='登録日時' value={formatAdminDate(member.createdAt)} />
                <Field label='最終更新' value={formatAdminDate(member.updatedAt)} />
                <div>
                  <dt className='text-[11px] text-[#9a9a9a]'>ステータス</dt>
                  <dd className='mt-1'>
                    <Badge tone={statusTone[member.status]}>{member.status}</Badge>
                    <p className='mt-1 text-[10px] text-[#9a9a9a]'>ステータス変更は Phase 3 予定</p>
                  </dd>
                </div>
              </dl>
            </div>
          </Section>

          <Section title='Bloom Profile 情報'>
            <dl className='space-y-4'>
              <Field label='自己紹介' value={detail.bio} />
              <Field label='Connection目的' value={detail.purposeLabels.join('、')} />
              <Field label='趣味・興味タグ' value={detail.interestLabels.join('、')} />
              <Field label='価値観タグ' value={detail.valueTagLabels.join('、')} />
              <Field
                label='MBTI / 16タイプ'
                value={detail.mbtiLabel ?? (detail.mbtiType === 'unknown' ? 'わからない / あとで入力' : null)}
              />
              <div>
                <dt className='text-[11px] text-[#9a9a9a]'>SNS URL</dt>
                <dd className='mt-1 space-y-1.5'>
                  {detail.socialLinks.length === 0 ? (
                    <span className='text-sm text-[#9a9a9a]'>未入力</span>
                  ) : (
                    detail.socialLinks.map((link) => (
                      <div key={link.platform} className='text-sm'>
                        <span className='text-[#6b6b6b]'>{link.platformLabel}: </span>
                        <span
                          className={`mr-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            link.isVisibleOnProfile
                              ? 'bg-[#eef4f1] text-[#1f5d4f]'
                              : 'bg-[#f3f2ef] text-[#9a9a9a]'
                          }`}
                        >
                          {link.isVisibleOnProfile ? '公開' : '非公開'}
                        </span>
                        <a
                          href={link.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-[#1f5d4f] underline-offset-2 hover:underline break-all'
                        >
                          {link.url}
                        </a>
                      </div>
                    ))
                  )}
                </dd>
              </div>
              <Field
                label='AI自己紹介'
                value={
                  detail.introductionAiGenerated
                    ? `AI下書きを使用${detail.introductionGeneratedAt ? `（${formatAdminDate(detail.introductionGeneratedAt)}）` : ''}`
                    : '未使用'
                }
              />
            </dl>
          </Section>

          <Section title='その他プロフィール'>
            <dl className='space-y-4'>
              <Field label='性格タイプ（従来）' value={detail.personalityLabel} />
              <Field label='希望するConnection' value={detail.desiredConnection} />
              <Field label='配慮事項・安全フラグ' value={detail.considerations} />
            </dl>
          </Section>

          <Section title='深掘り質問の回答'>
            {detail.deepAnswers.every((a) => !a.value) ? (
              <p className='text-sm text-[#9a9a9a]'>未入力</p>
            ) : (
              <dl className='space-y-3'>
                {detail.deepAnswers.map((a) => (
                  <Field key={a.label} label={a.label} value={a.value} />
                ))}
              </dl>
            )}
          </Section>
        </div>

        <div className='space-y-6'>
          <Section title='活動履歴'>
            <dl className='mb-4 grid grid-cols-3 gap-3 text-center'>
              <div className='rounded-xl bg-[#fbfaf7] px-3 py-2'>
                <dt className='text-[10px] text-[#9a9a9a]'>投稿数</dt>
                <dd className='text-lg font-semibold text-[#1a1a1a]'>{detail.postCount}</dd>
              </div>
              <div className='rounded-xl bg-[#fbfaf7] px-3 py-2'>
                <dt className='text-[10px] text-[#9a9a9a]'>写真投稿</dt>
                <dd className='text-lg font-semibold text-[#1a1a1a]'>{detail.photoCount}</dd>
              </div>
              <div className='rounded-xl bg-[#fbfaf7] px-3 py-2'>
                <dt className='text-[10px] text-[#9a9a9a]'>通報関連</dt>
                <dd className='text-lg font-semibold text-[#1a1a1a]'>{detail.reportCount}</dd>
              </div>
            </dl>

            <h3 className='mb-2 text-xs font-semibold text-[#6b6b6b]'>参加申請履歴</h3>
            {detail.applicationHistory.length === 0 ? (
              <p className='mb-4 text-xs text-[#9a9a9a]'>未入力</p>
            ) : (
              <ul className='mb-4 space-y-2'>
                {detail.applicationHistory.map((a) => (
                  <li key={a.id} className='rounded-xl border border-[#f1efe9] px-3 py-2 text-xs'>
                    <p className='font-medium text-[#1a1a1a]'>{a.eventTitle}</p>
                    <p className='text-[#6b6b6b]'>
                      {a.status} · 申請 {formatAdminDate(a.appliedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <h3 className='mb-2 text-xs font-semibold text-[#6b6b6b]'>承認済み参加イベント</h3>
            {detail.confirmedEvents.length === 0 ? (
              <p className='mb-4 text-xs text-[#9a9a9a]'>未入力</p>
            ) : (
              <ul className='mb-4 space-y-2'>
                {detail.confirmedEvents.map((e) => (
                  <li key={e.id} className='text-xs text-[#1a1a1a]'>
                    {e.title} <span className='text-[#9a9a9a]'>({formatAdminDate(e.startAt)})</span>
                  </li>
                ))}
              </ul>
            )}

            <h3 className='mb-2 text-xs font-semibold text-[#6b6b6b]'>主催イベント</h3>
            {detail.hostedEvents.length === 0 ? (
              <p className='mb-4 text-xs text-[#9a9a9a]'>未入力</p>
            ) : (
              <ul className='mb-4 space-y-2'>
                {detail.hostedEvents.map((e) => (
                  <li key={e.id} className='text-xs text-[#1a1a1a]'>
                    {e.title} <span className='text-[#9a9a9a]'>({formatAdminDate(e.startAt)})</span>
                  </li>
                ))}
              </ul>
            )}

            <h3 className='mb-2 text-xs font-semibold text-[#6b6b6b]'>グループ参加履歴</h3>
            {detail.groupHistory.length === 0 ? (
              <p className='text-xs text-[#9a9a9a]'>未入力</p>
            ) : (
              <ul className='space-y-2'>
                {detail.groupHistory.map((g) => (
                  <li key={g.groupId} className='text-xs text-[#1a1a1a]'>
                    {g.eventTitle} <span className='text-[#9a9a9a]'>({g.role})</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title='運営用'>
            <p className='text-sm text-[#6b6b6b]'>管理メモ欄は Phase 3 予定です。</p>
            {detail.trustNotes ? (
              <div className='mt-3'>
                <p className='text-[11px] text-[#9a9a9a]'>信頼確認メモ（既存フィールド）</p>
                <p className='mt-1 text-sm text-[#1a1a1a]'>{detail.trustNotes}</p>
              </div>
            ) : null}
            <button
              type='button'
              disabled
              className='mt-4 cursor-not-allowed rounded-full border border-[#e2ddd2] px-4 py-2 text-xs text-[#9a9a9a]'
            >
              ステータス変更（Phase 3）
            </button>
          </Section>
        </div>
      </div>
    </div>
  );
}
