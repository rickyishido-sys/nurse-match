import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { getCurrentUser } from '@/lib/data';

export default async function ReviewRejectedPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <section className='space-y-4 rounded-[28px] border border-pink-100 bg-white p-6 shadow-sm'>
        <h1 className='text-xl font-bold text-slate-900'>登録内容を確認できませんでした</h1>
        <p className='text-sm leading-7 text-slate-600'>
          ご提出いただいた登録内容または確認書類について、再度のご確認が必要です。
          <br />
          お手数ですが、下記の内容をご確認のうえ再提出をお願いいたします。
        </p>
        {user?.rejectedReason ? (
          <div className='rounded-2xl border border-rose-100 bg-rose-50 p-4'>
            <p className='text-xs font-semibold text-rose-700'>確認が必要な内容</p>
            <p className='mt-1 whitespace-pre-wrap text-sm leading-6 text-rose-800'>{user.rejectedReason}</p>
          </div>
        ) : (
          <p className='text-sm text-slate-600'>詳細はご登録のメールアドレス宛のご案内をご確認ください。</p>
        )}
        <Link href='/register/details' className='inline-flex h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white'>
          登録内容を修正して再提出する
        </Link>
      </section>
    </AppShell>
  );
}
