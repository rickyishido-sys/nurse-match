import Image from 'next/image';
import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { ctaPrimary } from '@/components/connection/ui/cta-classes';
import { getHanakaiViewer } from '@/lib/hanakai/session';

export default async function EventNotFound() {
  const viewer = await getHanakaiViewer();

  return (
    <ConnectionShell viewer={viewer}>
      <div className='flex min-h-[50vh] flex-col items-center justify-center text-center'>
        <div
          className='mb-6 flex h-24 w-24 items-center justify-center rounded-[28px]'
          style={{ background: 'radial-gradient(circle at 50% 36%, #eef3ef 0%, #e4ecdd 74%)' }}
        >
          <div className='relative h-14 w-14'>
            <Image src='/flow/matching.png' alt='' fill sizes='56px' className='object-contain' />
          </div>
        </div>
        <h1 className='text-xl font-semibold tracking-tight text-[#1a1a1a]'>
          イベントが見つかりませんでした
        </h1>
        <p className='mx-auto mt-3 max-w-sm text-sm leading-7 text-[#6b6b6b]'>
          イベントが終了・削除されたか、URLが正しくない可能性があります。
        </p>
        <Link href='/events' className={`mt-7 ${ctaPrimary}`}>
          イベント一覧へ戻る
        </Link>
      </div>
    </ConnectionShell>
  );
}
