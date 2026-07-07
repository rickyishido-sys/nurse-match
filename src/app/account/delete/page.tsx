import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ConnectionShell } from '@/components/connection/shell';
import { DeleteAccountForm } from '@/components/connection/delete-account-form';
import { getAuthenticatedAuthUserId, getViewerMemberId } from '@/lib/connection/identity';
import { isDeletedMember } from '@/lib/connection/member-status';
import { getMember } from '@/lib/connection/repo';
import { getHanakaiViewer } from '@/lib/hanakai/session';

const GOLD = '#b8956a';

export const metadata = {
  title: 'アカウント削除',
  robots: { index: false, follow: false },
};

export default async function AccountDeletePage() {
  const authUserId = await getAuthenticatedAuthUserId();
  if (!authUserId) {
    redirect('/login?next=/account/delete');
  }

  const viewer = await getHanakaiViewer();
  const memberId = await getViewerMemberId();
  const member = memberId ? await getMember(memberId) : null;

  if (isDeletedMember(member)) {
    redirect('/?account=deleted');
  }

  return (
    <ConnectionShell viewer={viewer} showNav={false}>
      <div className='mx-auto w-full max-w-[480px] space-y-8'>
        <section className='space-y-2'>
          <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
            ACCOUNT
          </p>
          <h1 className='text-[1.5rem] font-semibold leading-tight tracking-tight text-[#1a1a1a]'>
            アカウント削除
          </h1>
          <p className='text-sm leading-7 text-[#6b6b6b]'>
            HANAKAI Connection のアカウントを削除します。削除前に内容をご確認ください。
          </p>
        </section>

        <DeleteAccountForm />

        <div className='flex flex-col gap-3 sm:flex-row'>
          <Link
            href='/my-profile'
            className='flex h-12 flex-1 items-center justify-center rounded-full border border-[#d8d6d1] text-sm font-semibold text-[#6b6b6b]'
          >
            キャンセル
          </Link>
          <Link
            href='/privacy'
            className='flex h-12 flex-1 items-center justify-center rounded-full border border-[#ebe9e4] text-sm font-medium text-[#9a9a9a]'
          >
            プライバシーポリシー
          </Link>
        </div>
      </div>
    </ConnectionShell>
  );
}
