import { Suspense } from 'react';
import { AdminPageHeader, Badge } from '@/components/admin/ui';
import { AdminInquiryActions } from '@/components/admin/hanakai/hanakai-admin-inquiry-actions';
import { AdminSelectFilter } from '@/components/admin/hanakai/hanakai-admin-filters';
import { AdminFlashBanner, adminFlashMessage } from '@/components/admin/hanakai/hanakai-admin-flash';
import { AdminEmptyState, formatAdminDate } from '@/components/admin/hanakai/hanakai-admin-shared';
import {
  CONTACT_INQUIRY_STATUS_LABEL,
  listHanakaiAdminInquiries,
  type ContactInquiryStatus,
} from '@/lib/connection/contact-inquiry';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function param(sp: Record<string, string | string[] | undefined>, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

const statusOptions = [
  { value: 'all', label: 'すべて' },
  { value: 'new', label: '未対応' },
  { value: 'resolved', label: '対応済み' },
];

const statusTone = {
  new: 'amber' as const,
  resolved: 'green' as const,
};

async function InquiriesContent({ statusFilter }: { statusFilter: ContactInquiryStatus | 'all' }) {
  const inquiries = await listHanakaiAdminInquiries({ status: statusFilter });

  if (inquiries.length === 0) {
    return (
      <AdminEmptyState
        title='お問い合わせはありません'
        description={statusFilter === 'new' ? '未対応のお問い合わせはありません。' : '該当するお問い合わせがありません。'}
      />
    );
  }

  return (
    <>
      <div className='hidden overflow-x-auto rounded-2xl border border-[#ebe7dd] bg-white md:block'>
        <table className='min-w-full text-left text-sm'>
          <thead className='border-b border-[#f1efe9] bg-[#fbfaf7] text-[11px] text-[#9a9a9a]'>
            <tr>
              <th className='px-4 py-3 font-medium'>受付日時</th>
              <th className='px-4 py-3 font-medium'>名前</th>
              <th className='px-4 py-3 font-medium'>メール</th>
              <th className='px-4 py-3 font-medium'>種別</th>
              <th className='px-4 py-3 font-medium'>本文</th>
              <th className='px-4 py-3 font-medium'>ステータス</th>
              <th className='px-4 py-3 font-medium'>操作</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((row) => (
              <tr key={row.id} className='border-b border-[#f7f5f0] last:border-b-0'>
                <td className='px-4 py-3 text-[#6b6b6b]'>{formatAdminDate(row.createdAt)}</td>
                <td className='px-4 py-3'>{row.name}</td>
                <td className='px-4 py-3 text-[#6b6b6b]'>{row.email}</td>
                <td className='px-4 py-3'>{row.categoryLabel}</td>
                <td className='max-w-[240px] whitespace-pre-wrap px-4 py-3 text-[#6b6b6b]'>{row.message}</td>
                <td className='px-4 py-3'>
                  <Badge tone={statusTone[row.status]}>{CONTACT_INQUIRY_STATUS_LABEL[row.status]}</Badge>
                </td>
                <td className='px-4 py-3'>
                  <AdminInquiryActions inquiryId={row.id} status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='space-y-3 md:hidden'>
        {inquiries.map((row) => (
          <article key={row.id} className='rounded-2xl border border-[#ebe7dd] bg-white p-4'>
            <div className='mb-2 flex items-center justify-between gap-2'>
              <p className='text-sm font-semibold text-[#1a1a1a]'>{row.name}</p>
              <Badge tone={statusTone[row.status]}>{CONTACT_INQUIRY_STATUS_LABEL[row.status]}</Badge>
            </div>
            <p className='text-xs text-[#6b6b6b]'>{formatAdminDate(row.createdAt)}</p>
            <p className='mt-1 text-xs text-[#6b6b6b]'>{row.email}</p>
            <p className='mt-1 text-xs font-medium text-[#1f5d4f]'>{row.categoryLabel}</p>
            <p className='mt-3 whitespace-pre-wrap text-sm leading-6 text-[#4a4a4a]'>{row.message}</p>
            <div className='mt-3'>
              <AdminInquiryActions inquiryId={row.id} status={row.status} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export default async function HanakaiAdminInquiriesPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const statusRaw = param(sp, 'status') || 'new';
  const statusFilter: ContactInquiryStatus | 'all' =
    statusRaw === 'resolved' || statusRaw === 'all' ? statusRaw : 'new';
  const flash = adminFlashMessage(param(sp, 'success'), param(sp, 'error'));

  return (
    <div className='space-y-6'>
      <AdminPageHeader
        kicker='INQUIRIES'
        title='お問い合わせ'
        description='ユーザーからのお問い合わせ一覧です。'
      />

      {flash ? <AdminFlashBanner variant={flash.variant} message={flash.message} /> : null}

      <Suspense fallback={null}>
        <AdminSelectFilter paramKey='status' label='ステータス' options={statusOptions} defaultValue='new' />
      </Suspense>

      <Suspense fallback={<p className='text-sm text-[#9a9a9a]'>読み込み中…</p>}>
        <InquiriesContent statusFilter={statusFilter} />
      </Suspense>
    </div>
  );
}
