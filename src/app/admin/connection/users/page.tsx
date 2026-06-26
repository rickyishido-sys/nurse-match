import Image from 'next/image';
import {
  AdminCard,
  AdminPageHeader,
  FlashBanner,
  HostStatusBadge,
  UserStatusBadge,
  VerificationBadge,
} from '@/components/admin/ui';
import {
  GENDER_LABEL,
  HOST_STATUS_LABEL,
  USER_STATUS_LABEL,
  VERIFICATION_LABEL,
  listAdminUsers,
} from '@/lib/connection/admin-data';
import {
  updateUserHostAction,
  updateUserNoteAction,
  updateUserStatusAction,
  updateUserVerificationAction,
} from '@/lib/connection/admin-actions';
import type { AdminUser } from '@/lib/connection/admin-types';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

const selectClass =
  'rounded-lg border border-[#e2ddd2] bg-white px-2 py-1.5 text-xs text-[#1a1a1a] outline-none focus:border-[#1f5d4f]';
const submitClass =
  'rounded-lg bg-[#1f5d4f] px-3 py-1.5 text-xs font-semibold text-white transition active:scale-[0.97]';

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const updated = typeof sp.updated === 'string' ? sp.updated : '';
  const focusReport = sp.focus === 'report';

  const all = listAdminUsers();
  const users = focusReport ? all.filter((u) => u.reportCount > 0 || u.status !== 'active') : all;

  return (
    <div className='space-y-6'>
      <AdminPageHeader
        kicker='USERS'
        title='ユーザー管理'
        description='本人確認・参加状況・Host権限・通報状況をもとに、安心して任せられる状態かを判断します。'
      />

      {updated ? <FlashBanner>更新しました。</FlashBanner> : null}
      {focusReport ? (
        <p className='rounded-2xl border border-[#eccaba] bg-[#fbf0ea] px-4 py-3 text-xs text-[#a8602f]'>
          通報・注意が必要なユーザーのみ表示しています。
        </p>
      ) : null}

      <div className='space-y-4'>
        {users.map((u) => (
          <UserRow key={u.id} user={u} />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className='rounded-xl border border-[#f0ece3] bg-[#faf9f5] px-3 py-2'>
      <p className='text-[10px] text-[#9a9a9a]'>{label}</p>
      <p className='text-sm font-semibold text-[#1a1a1a]'>{value}</p>
    </div>
  );
}

function UserRow({ user: u }: { user: AdminUser }) {
  return (
    <AdminCard>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex items-start gap-3'>
          <Image src={u.avatarUrl} alt={u.nickname} width={48} height={48} className='h-12 w-12 shrink-0 rounded-full object-cover' />
          <div className='space-y-1.5'>
            <div className='flex flex-wrap items-center gap-2'>
              <p className='text-sm font-semibold text-[#1a1a1a]'>{u.nickname}</p>
              <span className='text-xs text-[#9a9a9a]'>
                {u.age}歳 · {GENDER_LABEL[u.gender]} · {u.area}
              </span>
            </div>
            <p className='text-xs text-[#6b6b6b]'>{u.occupation}</p>
            <div className='flex flex-wrap gap-1.5'>
              <VerificationBadge value={u.verification} />
              <HostStatusBadge value={u.hostStatus} />
              <UserStatusBadge value={u.status} />
              {u.reportCount > 0 ? (
                <span className='inline-flex items-center rounded-full border border-[#e7b9b9] bg-[#fbeeee] px-2.5 py-0.5 text-[11px] font-medium text-[#a23b3b]'>
                  通報 {u.reportCount}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className='mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4'>
        <Stat label='参加回数' value={`${u.participationCount}回`} />
        <Stat label='主催回数' value={`${u.hostingCount}回`} />
        <Stat label='Connection数' value={u.connectionCount} />
        <Stat label='再会率' value={`${Math.round(u.reunionRate * 100)}%`} />
      </div>

      <div className='mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3'>
        <form action={updateUserVerificationAction} className='flex items-center gap-2'>
          <input type='hidden' name='userId' value={u.id} />
          <label className='w-16 shrink-0 text-[11px] text-[#9a9a9a]'>本人確認</label>
          <select name='verification' defaultValue={u.verification} className={`${selectClass} flex-1`}>
            {(Object.keys(VERIFICATION_LABEL) as (keyof typeof VERIFICATION_LABEL)[]).map((k) => (
              <option key={k} value={k}>{VERIFICATION_LABEL[k]}</option>
            ))}
          </select>
          <button className={submitClass}>更新</button>
        </form>

        <form action={updateUserStatusAction} className='flex items-center gap-2'>
          <input type='hidden' name='userId' value={u.id} />
          <label className='w-16 shrink-0 text-[11px] text-[#9a9a9a]'>状態</label>
          <select name='status' defaultValue={u.status} className={`${selectClass} flex-1`}>
            {(Object.keys(USER_STATUS_LABEL) as (keyof typeof USER_STATUS_LABEL)[]).map((k) => (
              <option key={k} value={k}>{USER_STATUS_LABEL[k]}</option>
            ))}
          </select>
          <button className={submitClass}>更新</button>
        </form>

        <form action={updateUserHostAction} className='flex items-center gap-2'>
          <input type='hidden' name='userId' value={u.id} />
          <label className='w-16 shrink-0 text-[11px] text-[#9a9a9a]'>Host権限</label>
          <select name='hostStatus' defaultValue={u.hostStatus} className={`${selectClass} flex-1`}>
            {(Object.keys(HOST_STATUS_LABEL) as (keyof typeof HOST_STATUS_LABEL)[]).map((k) => (
              <option key={k} value={k}>{HOST_STATUS_LABEL[k]}</option>
            ))}
          </select>
          <button className={submitClass}>更新</button>
        </form>
      </div>

      <form action={updateUserNoteAction} className='mt-3'>
        <input type='hidden' name='userId' value={u.id} />
        <label className='mb-1.5 block text-[11px] text-[#9a9a9a]'>運営メモ</label>
        <div className='flex gap-2'>
          <textarea
            name='note'
            rows={2}
            defaultValue={u.adminNote}
            placeholder='対応の経緯や申し送りを記録'
            className='flex-1 resize-none rounded-lg border border-[#e2ddd2] bg-white px-3 py-2 text-xs leading-6 text-[#1a1a1a] outline-none focus:border-[#1f5d4f]'
          />
          <button className='shrink-0 self-end rounded-lg border border-[#1f5d4f] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f5d4f]'>
            保存
          </button>
        </div>
      </form>
    </AdminCard>
  );
}
