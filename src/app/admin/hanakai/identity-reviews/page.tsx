import Link from 'next/link';
import { AdminPageHeader, Badge } from '@/components/admin/ui';
import { AdminEmptyState, formatAdminDate } from '@/components/admin/hanakai/hanakai-admin-shared';
import { AdminFlashBanner } from '@/components/admin/hanakai/hanakai-admin-flash';
import { adminFlashMessage } from '@/lib/connection/hanakai-admin-flash';
import { HanakaiAdminIdentityReviewActions } from '@/components/admin/hanakai/hanakai-admin-identity-review-actions';
import { listHanakaiIdentityReviews } from '@/lib/connection/hanakai-admin-repo';
import { IDENTITY_STATUS_LABEL } from '@/lib/connection/identity-verification';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function param(sp: Record<string, string | string[] | undefined>, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

export default async function HanakaiAdminIdentityReviewsPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const flash = adminFlashMessage(param(sp, 'success'), param(sp, 'error'));
  const reviews = await listHanakaiIdentityReviews();

  return (
    <div className='space-y-6'>
      <AdminPageHeader
        kicker='IDENTITY REVIEW'
        title='本人確認審査'
        description='提出された本人確認書類の審査（署名付きURL・運営のみ閲覧可）'
      />
      {flash ? <AdminFlashBanner variant={flash.variant} message={flash.message} /> : null}
      <p className='text-xs text-[#9a9a9a]'>
        ※ 本人確認書類は署名付きURLで表示します。一般ユーザー・他主催者には公開されません。
      </p>

      {reviews.length === 0 ? (
        <AdminEmptyState title='審査待ちの本人確認申請はありません' />
      ) : (
        <div className='space-y-4'>
          {reviews.map((row) => (
            <section
              key={row.memberId}
              className='rounded-2xl border border-[#ebe7dd] bg-white p-5'
            >
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div>
                  <h2 className='text-base font-semibold text-[#1a1a1a]'>
                    <Link href={`/admin/hanakai/members/${row.memberId}`} className='hover:underline'>
                      {row.nickname}
                    </Link>
                  </h2>
                  <p className='mt-1 text-xs text-[#6b6b6b]'>{row.email ?? 'メール未設定'}</p>
                  <p className='mt-1 text-xs text-[#9a9a9a]'>居住エリア: {row.area}</p>
                </div>
                <Badge tone={row.identityStatus === 'pending' ? 'amber' : 'redSoft'}>
                  {IDENTITY_STATUS_LABEL[row.identityStatus === 'pending' ? 'pending' : 'resubmission_required']}
                </Badge>
              </div>

              <dl className='mt-4 grid gap-3 text-sm sm:grid-cols-2'>
                <div>
                  <dt className='text-[11px] text-[#9a9a9a]'>提出日時</dt>
                  <dd>{row.submittedAt ? formatAdminDate(row.submittedAt) : '—'}</dd>
                </div>
                <div>
                  <dt className='text-[11px] text-[#9a9a9a]'>書類ステータス</dt>
                  <dd>{row.documentUploadStatus}</dd>
                </div>
                {row.lastReviewedAt ? (
                  <div>
                    <dt className='text-[11px] text-[#9a9a9a]'>前回審査</dt>
                    <dd>
                      {formatAdminDate(row.lastReviewedAt)}
                      {row.lastReviewedByNickname ? ` / ${row.lastReviewedByNickname}` : ''}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {row.signedDocumentUrl ? (
                <div className='mt-4'>
                  <p className='mb-2 text-[11px] font-medium text-[#6b6b6b]'>提出書類（署名付き・5分有効）</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={row.signedDocumentUrl}
                    alt='本人確認書類'
                    className='max-h-64 rounded-xl border border-[#ebe7dd] object-contain'
                  />
                  <p className='mt-2'>
                    <a
                      href={row.signedDocumentUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-xs text-[#1f5d4f] underline-offset-2 hover:underline'
                    >
                      別タブで開く
                    </a>
                  </p>
                </div>
              ) : (
                <p className='mt-4 text-xs text-amber-700'>書類URLを取得できませんでした（未提出または期限切れ）</p>
              )}

              <HanakaiAdminIdentityReviewActions row={row} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
