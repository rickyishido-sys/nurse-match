import Link from 'next/link';
import { Suspense } from 'react';
import { AdminPageHeader, Badge } from '@/components/admin/ui';
import { AdminSearchBar } from '@/components/admin/hanakai/hanakai-admin-filters';
import { AdminEmptyState, formatAdminDate } from '@/components/admin/hanakai/hanakai-admin-shared';
import { HanakaiAdminMemberAvatar } from '@/components/admin/hanakai/hanakai-admin-member-avatar';
import { listHanakaiAdminMembers } from '@/lib/connection/hanakai-admin-repo';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function param(sp: Record<string, string | string[] | undefined>, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v) ?? '';
}

const statusTone = {
  active: 'green' as const,
  warning: 'amber' as const,
  suspended: 'redSoft' as const,
  deleted: 'gray' as const,
};

const statusLabel = {
  active: 'active',
  warning: 'warning',
  suspended: 'suspended',
  deleted: '退会済み',
};

async function MembersContent({ query }: { query: string }) {
  const members = await listHanakaiAdminMembers(query);

  if (members.length === 0) {
    return <AdminEmptyState title='該当する会員が見つかりません' description='検索条件を変えてお試しください。' />;
  }

  return (
    <>
      <div className='hidden overflow-x-auto rounded-2xl border border-[#ebe7dd] bg-white md:block'>
        <table className='min-w-full text-left text-sm'>
          <thead className='border-b border-[#f1efe9] bg-[#fbfaf7] text-[11px] text-[#9a9a9a]'>
            <tr>
              <th className='px-4 py-3 font-medium'>写真</th>
              <th className='px-4 py-3 font-medium'>表示名</th>
              <th className='px-4 py-3 font-medium'>年齢</th>
              <th className='px-4 py-3 font-medium'>性別</th>
              <th className='px-4 py-3 font-medium'>居住エリア</th>
              <th className='px-4 py-3 font-medium'>ライフフェーズ</th>
              <th className='px-4 py-3 font-medium'>本人確認</th>
              <th className='px-4 py-3 font-medium'>登録日時</th>
              <th className='px-4 py-3 font-medium'>更新日時</th>
              <th className='px-4 py-3 font-medium'>ステータス</th>
              <th className='px-4 py-3 font-medium'>詳細</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className='border-b border-[#f7f5f0] last:border-b-0'>
                <td className='px-4 py-3'>
                  <HanakaiAdminMemberAvatar nickname={m.nickname} avatarUrl={m.avatarUrl} gender={m.gender} size={36} />
                </td>
                <td className='px-4 py-3 font-medium'>{m.nickname}</td>
                <td className='px-4 py-3'>{m.age || '—'}</td>
                <td className='px-4 py-3'>{m.genderLabel}</td>
                <td className='px-4 py-3'>{m.area}</td>
                <td className='px-4 py-3'>{m.lifePhaseLabel}</td>
                <td className='px-4 py-3'>
                  <Badge
                    tone={
                      m.identityStatus === 'verified'
                        ? 'green'
                        : m.identityStatus === 'reviewing'
                          ? 'amber'
                          : 'gray'
                    }
                  >
                    {m.identityStatusLabel}
                  </Badge>
                </td>
                <td className='px-4 py-3 text-[#6b6b6b]'>{formatAdminDate(m.createdAt)}</td>
                <td className='px-4 py-3 text-[#6b6b6b]'>{formatAdminDate(m.updatedAt)}</td>
                <td className='px-4 py-3'>
                  <Badge tone={statusTone[m.status]}>{statusLabel[m.status]}</Badge>
                </td>
                <td className='px-4 py-3'>
                  <Link
                    href={`/admin/hanakai/members/${m.id}`}
                    className='rounded-full border border-[#1f5d4f] px-3 py-1 text-[11px] font-medium text-[#1f5d4f] transition hover:bg-[#eef3ef]'
                  >
                    詳細
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='space-y-3 md:hidden'>
        {members.map((m) => (
          <article key={m.id} className='rounded-2xl border border-[#ebe7dd] bg-white p-4'>
            <div className='flex items-center gap-3'>
              <HanakaiAdminMemberAvatar nickname={m.nickname} avatarUrl={m.avatarUrl} gender={m.gender} size={44} />
              <div className='min-w-0 flex-1'>
                <p className='font-semibold text-[#1a1a1a]'>{m.nickname}</p>
                <p className='text-xs text-[#6b6b6b]'>
                  {m.age ? `${m.age}歳` : '—'} · {m.genderLabel} · {m.area}
                </p>
              </div>
              <Link
                href={`/admin/hanakai/members/${m.id}`}
                className='shrink-0 rounded-full border border-[#1f5d4f] px-3 py-1 text-[11px] text-[#1f5d4f]'
              >
                詳細
              </Link>
            </div>
            <dl className='mt-3 grid grid-cols-2 gap-2 text-xs'>
              <div>
                <dt className='text-[#9a9a9a]'>ライフフェーズ</dt>
                <dd className='text-[#1a1a1a]'>{m.lifePhaseLabel}</dd>
              </div>
              <div>
                <dt className='text-[#9a9a9a]'>ステータス</dt>
                <dd>
                  <Badge tone={statusTone[m.status]}>{statusLabel[m.status]}</Badge>
                </dd>
              </div>
              <div>
                <dt className='text-[#9a9a9a]'>本人確認</dt>
                <dd className='mt-0.5'>
                  <Badge
                    tone={
                      m.identityStatus === 'verified'
                        ? 'green'
                        : m.identityStatus === 'reviewing'
                          ? 'amber'
                          : 'gray'
                    }
                  >
                    {m.identityStatusLabel}
                  </Badge>
                </dd>
              </div>
              <div className='col-span-2'>
                <dt className='text-[#9a9a9a]'>登録日時</dt>
                <dd className='text-[#1a1a1a]'>{formatAdminDate(m.createdAt)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}

export default async function HanakaiAdminMembersPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const query = param(sp, 'q');

  return (
    <div className='space-y-6'>
      <AdminPageHeader
        kicker='MEMBERS'
        title='会員一覧'
        description='登録済みメンバーの一覧です。詳細ページでプロフィールと活動履歴を確認できます。'
      />

      <Suspense fallback={<div className='h-10 animate-pulse rounded-xl bg-[#ebe7dd]' />}>
        <AdminSearchBar defaultValue={query} placeholder='表示名・エリア・IDで検索' />
      </Suspense>

      <Suspense
        fallback={
          <div className='space-y-2'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-16 animate-pulse rounded-2xl bg-[#ebe7dd]' />
            ))}
          </div>
        }
      >
        <MembersContent query={query} />
      </Suspense>
    </div>
  );
}
