import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { ManageNav } from '@/components/connection/manage-nav';
import { Card } from '@/components/connection/ui';
import { listExperienceRequestsByGroup } from '@/lib/connection/experience-request';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export const metadata = {
  title: '体験リクエスト詳細',
  robots: { index: false, follow: false },
};

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const v = sp[key];
  return typeof v === 'string' ? v : Array.isArray(v) ? v[0] ?? '' : '';
}

export default async function ManageExperienceRequestDetailPage({ searchParams }: PageProps) {
  const viewer = await getHanakaiViewer();
  const sp = searchParams ? await searchParams : {};
  const category = param(sp, 'category');
  const prefecture = param(sp, 'prefecture');
  const city = param(sp, 'city');

  const rows =
    category && prefecture && city
      ? await listExperienceRequestsByGroup(category, prefecture, city)
      : [];

  return (
    <ConnectionShell viewer={viewer}>
      <div className='space-y-6'>
        <div className='space-y-2'>
          <Link href='/manage/experience-requests' prefetch className='text-xs font-semibold text-[#1f5d4f] hover:underline'>
            ← 体験リクエスト一覧
          </Link>
          <h1 className='text-xl font-semibold text-[#1a1a1a]'>
            {category || '—'} · {city || '—'}
          </h1>
          <p className='text-xs text-[#6b6b6b]'>{prefecture}</p>
        </div>

        <ManageNav active='experience-requests' />

        {rows.length === 0 ? (
          <p className='text-sm text-[#9a9a9a]'>該当するリクエストがありません。</p>
        ) : (
          <div className='space-y-3'>
            <p className='text-xs font-medium text-[#6b6b6b]'>希望者一覧（{rows.length}件）</p>
            {rows.map((row) => (
              <Card key={row.id}>
                <div className='flex flex-wrap items-center gap-2 text-xs text-[#6b6b6b]'>
                  <span className='rounded-full bg-[#f3f7f5] px-2 py-0.5 font-semibold text-[#1f5d4f]'>{row.ageGroup}</span>
                  <span>{row.preferredDays.join(' · ')}</span>
                </div>
                <p className='mt-2 text-xs text-[#9a9a9a]'>
                  カテゴリー: {row.categories.join('、')}
                </p>
                {row.comment ? (
                  <p className='mt-3 text-sm leading-7 text-[#4a4a4a]'>{row.comment}</p>
                ) : (
                  <p className='mt-3 text-sm text-[#9a9a9a]'>（コメントなし）</p>
                )}
                <p className='mt-2 text-[10px] text-[#9a9a9a]'>
                  {new Date(row.createdAt).toLocaleString('ja-JP')}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ConnectionShell>
  );
}
