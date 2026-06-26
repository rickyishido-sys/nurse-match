import Image from 'next/image';
import {
  AdminCard,
  AdminPageHeader,
  FlashBanner,
  HostStatusBadge,
  VerificationBadge,
} from '@/components/admin/ui';
import { getAdminUser, listHostApplications } from '@/lib/connection/admin-data';
import { updateHostApplicationAction, updateHostApplicationNoteAction } from '@/lib/connection/admin-actions';
import type { HostApplication } from '@/lib/connection/admin-types';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

const btn = 'rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-[0.97]';

export default async function AdminHostsPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const updated = typeof sp.updated === 'string' ? sp.updated : '';
  const applications = listHostApplications();

  return (
    <div className='space-y-6'>
      <AdminPageHeader
        kicker='HOSTS'
        title='Host申請管理'
        description='誰でもHost申請はできます。ただし、イベント作成権限の付与は運営承認制です。'
      />

      <AdminCard className='bg-[#faf9f5]'>
        <p className='mb-2 text-xs font-semibold text-[#1a1a1a]'>Host承認の考え方</p>
        <ul className='grid grid-cols-1 gap-1 text-xs leading-6 text-[#6b6b6b] sm:grid-cols-2'>
          <li>・本人確認済みであること</li>
          <li>・イベント参加経験が1回以上あること</li>
          <li>・参加態度に問題がないこと</li>
          <li>・通報履歴に重大な問題がないこと</li>
          <li>・コミュニティガイドラインに同意していること</li>
          <li>・運営が安心して任せられること</li>
        </ul>
      </AdminCard>

      {updated ? <FlashBanner>Host申請のステータスを更新しました。</FlashBanner> : null}

      <div className='space-y-4'>
        {applications.map((a) => (
          <HostRow key={a.id} application={a} />
        ))}
      </div>
    </div>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] ${
        ok ? 'border-[#bcdacb] bg-[#eef6f1] text-[#1f5d4f]' : 'border-[#e2ddd2] bg-[#f5f3ee] text-[#9a9a9a]'
      }`}
    >
      {ok ? '✓' : '—'} {label}
    </span>
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

function HostRow({ application: a }: { application: HostApplication }) {
  const member = getAdminUser(a.memberId);
  const verified = a.verification === 'verified' || a.verification === 'assured';

  return (
    <AdminCard>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex items-start gap-3'>
          {member ? (
            <Image src={member.avatarUrl} alt={member.nickname} width={48} height={48} className='h-12 w-12 shrink-0 rounded-full object-cover' />
          ) : null}
          <div className='space-y-1.5'>
            <div className='flex flex-wrap items-center gap-2'>
              <p className='text-sm font-semibold text-[#1a1a1a]'>{member?.nickname ?? a.memberId}</p>
              <HostStatusBadge value={a.status} />
            </div>
            <div className='flex flex-wrap gap-1.5'>
              <VerificationBadge value={a.verification} />
              {member ? <span className='text-xs text-[#9a9a9a]'>{member.age}歳 · {member.area}</span> : null}
            </div>
          </div>
        </div>
      </div>

      <div className='mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4'>
        <Stat label='参加回数' value={`${a.participationCount}回`} />
        <Stat label='主催回数' value={`${a.hostingCount}回`} />
        <Stat label='平均レビュー' value={a.averageReview.toFixed(1)} />
        <Stat label='通報件数' value={a.reportCount} />
      </div>

      <div className='mt-3 flex flex-wrap gap-1.5'>
        <Check ok={verified} label='本人確認' />
        <Check ok={a.participationCount >= 1} label='参加経験' />
        <Check ok={a.reportCount === 0} label='参加態度' />
        <Check ok={a.agreedGuidelines} label='ガイドライン同意' />
      </div>

      <div className='mt-3 rounded-xl bg-[#faf9f5] p-3'>
        <p className='text-[10px] text-[#9a9a9a]'>申請理由</p>
        <p className='mt-1 text-sm leading-7 text-[#4a4a4a]'>{a.reason}</p>
      </div>

      <div className='mt-4 flex flex-wrap gap-2'>
        {(
          [
            { status: 'community', label: 'Community Hostに承認', cls: 'bg-[#1f5d4f] text-white' },
            { status: 'trusted', label: 'Trusted Hostに昇格', cls: 'bg-[#1f5d4f] text-white' },
            { status: 'premium', label: 'Premium Hostに昇格', cls: 'border border-[#e3d9c4] bg-[#fbf7ee] text-[#7a5f2e]' },
            { status: 'suspended', label: '停止', cls: 'border border-[#eccaba] bg-[#fbf0ea] text-[#a8602f]' },
            { status: 'rejected', label: '却下', cls: 'border border-[#e7b9b9] bg-[#fbeeee] text-[#a23b3b]' },
          ] as const
        ).map((action) => (
          <form key={action.status} action={updateHostApplicationAction}>
            <input type='hidden' name='applicationId' value={a.id} />
            <input type='hidden' name='status' value={action.status} />
            <button className={`${btn} ${action.cls}`}>{action.label}</button>
          </form>
        ))}
      </div>

      <form action={updateHostApplicationNoteAction} className='mt-3'>
        <input type='hidden' name='applicationId' value={a.id} />
        <label className='mb-1.5 block text-[11px] text-[#9a9a9a]'>運営メモ</label>
        <div className='flex gap-2'>
          <textarea
            name='note'
            rows={2}
            defaultValue={a.adminNote}
            className='flex-1 resize-none rounded-lg border border-[#e2ddd2] bg-white px-3 py-2 text-xs leading-6 outline-none focus:border-[#1f5d4f]'
          />
          <button className='shrink-0 self-end rounded-lg border border-[#1f5d4f] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f5d4f]'>
            保存
          </button>
        </div>
      </form>
    </AdminCard>
  );
}
