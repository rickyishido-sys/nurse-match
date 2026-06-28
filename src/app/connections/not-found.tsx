import Image from 'next/image';
import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { getHanakaiViewer } from '@/lib/hanakai/session';

export default async function ConnectionNotFound() {
  const viewer = await getHanakaiViewer();
  return (
    <ConnectionShell viewer={viewer}>
      <div className='flex min-h-[60vh] flex-col items-center justify-center text-center'>
        <div
          className='mb-6 flex h-24 w-24 items-center justify-center rounded-[28px]'
          style={{ background: 'radial-gradient(circle at 50% 36%, #eef3ef 0%, #e4ecdd 74%)' }}
        >
          <div className='relative h-14 w-14'>
            <Image src='/flow/matching.png' alt='' fill sizes='56px' className='object-contain' />
          </div>
        </div>
        <h1 className='text-xl font-semibold tracking-tight text-[#1a1a1a]'>
          このConnectionは見つかりませんでした
        </h1>
        <p className='mx-auto mt-3 max-w-sm text-sm leading-7 text-[#6b6b6b]'>
          イベントが削除されたか、まだ参加履歴がありません。
        </p>
        <div className='mt-7 flex flex-col items-center gap-3'>
          <Link
            href='/events'
            className='inline-flex h-11 items-center justify-center rounded-full bg-[#1f5d4f] px-7 text-sm font-semibold text-white transition active:scale-[0.98]'
          >
            イベント一覧へ戻る
          </Link>
          <Link
            href='/connections'
            className='text-xs font-semibold text-[#8b7355] underline-offset-2 hover:underline'
          >
            自分のConnectionを見る
          </Link>
        </div>
      </div>
    </ConnectionShell>
  );
}
