import Link from 'next/link';
import type { HanakaiAdminAccessReason } from '@/lib/connection/hanakai-admin-access';

const copy: Record<HanakaiAdminAccessReason, { title: string; body: string }> = {
  ok: { title: '', body: '' },
  no_session: {
    title: 'ログインが必要です',
    body: 'HANAKAI運営管理画面は、ログイン済みの運営管理者のみアクセスできます。',
  },
  not_admin: {
    title: 'アクセス権限がありません',
    body: 'このページは HANAKAI 運営管理者のみが閲覧できます。アクセスが必要な場合は運営にお問い合わせください。',
  },
};

export function HanakaiAdminForbidden({ reason }: { reason: Exclude<HanakaiAdminAccessReason, 'ok'> }) {
  const { title, body } = copy[reason];

  return (
    <div className='flex min-h-[60vh] flex-col items-center justify-center px-4 text-center'>
      <div className='mx-auto max-w-md space-y-4 rounded-3xl border border-[#ebe7dd] bg-white px-8 py-10 shadow-[0_1px_8px_rgba(31,93,79,0.04)]'>
        <p className='text-[11px] font-semibold tracking-[0.2em] text-[#1f5d4f]'>HANAKAI ADMIN</p>
        <h1 className='text-xl font-semibold text-[#1a1a1a]'>{title}</h1>
        <p className='text-sm leading-7 text-[#6b6b6b]'>{body}</p>
        <div className='flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center'>
          <Link
            href='/home'
            className='inline-flex h-11 items-center justify-center rounded-full bg-[#1f5d4f] px-6 text-sm font-semibold text-white'
          >
            トップへ戻る
          </Link>
          {reason === 'no_session' ? (
            <Link
              href='/login'
              className='inline-flex h-11 items-center justify-center rounded-full border border-[#e2ddd2] px-6 text-sm font-semibold text-[#6b6b6b]'
            >
              ログイン
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
