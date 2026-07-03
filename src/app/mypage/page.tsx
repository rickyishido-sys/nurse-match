import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Badge } from '@/components/badges';
import { getAccessState, requireUser } from '@/lib/guard';

export default async function MyPage() {
  const user = await requireUser();
  const state = await getAccessState(user);

  if (state === 'pending') redirect('/pending-review');
  if (state === 'rejected') redirect('/review-rejected');
  if (state === 'suspended') redirect('/suspended');

  return (
    <AppShell user={user}>
      <section className='space-y-4 rounded-[28px] border border-pink-100 bg-white p-6 shadow-sm'>
        <h1 className='text-xl font-bold text-slate-900'>マイページ</h1>
        <div className='flex items-center gap-3'>
          <Image
            src={user.profileImageUrl || '/icon.png'}
            alt='プロフィール画像'
            width={64}
            height={64}
            className='h-16 w-16 rounded-full object-cover'
          />
          <div>
            <p className='font-semibold text-slate-900'>{user.nickname}</p>
            <Badge tone='green'>審査済み</Badge>
          </div>
        </div>
        <p className='text-sm leading-7 text-slate-600'>プロフィールを充実させることで、より相性の良いお相手と出会いやすくなります。</p>
        <div className='flex flex-wrap gap-2'>
          <Link href='/profile/edit' className='rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700'>
            プロフィール編集
          </Link>
          <Link href='/app' className='rounded-xl bg-slate-900 px-4 py-2 text-sm text-white'>
            カードを見る
          </Link>
          <Link href='/profile/edit' className='rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700'>
            詳細プロフィール入力
          </Link>
        </div>
      </section>
      {user.gender === 'male' && user.verificationStatus === 'approved' ? (
        <section className='space-y-3 rounded-[28px] border border-pink-100 bg-white p-6 shadow-sm'>
          <h2 className='text-lg font-semibold text-slate-900'>運用feeを、出会いのきっかけに。</h2>
          <p className='text-sm leading-7 text-slate-600'>
            ETH/USDCの運用で得たfeeを、
            <br />
            HANAKAI Connection のイベントや体験の利用に活用する。
            <br />
            そんな新しい使い方を準備しています。
          </p>
          <Link href='/datefi' className='inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white'>
            詳しく見る
          </Link>
        </section>
      ) : null}
    </AppShell>
  );
}

