import Image from 'next/image';
import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { ctaPrimary } from '@/components/connection/ui/cta-classes';
import { getHanakaiViewer } from '@/lib/hanakai/session';

export default async function NotFound() {
  const viewer = await getHanakaiViewer();

  return (
    <ConnectionShell viewer={viewer} showNav={false}>
      <div className='flex min-h-[60vh] flex-col items-center justify-center text-center'>
        <div
          className='mb-6 flex h-24 w-24 items-center justify-center rounded-[28px]'
          style={{ background: 'radial-gradient(circle at 50% 36%, #eef3ef 0%, #e4ecdd 74%)' }}
        >
          <div className='relative h-14 w-14'>
            <Image src='/flow/matching.png' alt='' fill sizes='56px' className='object-contain' />
          </div>
        </div>
        <p className='text-[11px] font-semibold tracking-[0.2em] text-[#9a9a9a]'>404</p>
        <h1 className='mt-2 text-xl font-semibold tracking-tight text-[#1a1a1a]'>
          ページが見つかりませんでした
        </h1>
        <p className='mx-auto mt-3 max-w-sm text-sm leading-7 text-[#6b6b6b]'>
          リンクが古いか、ページが移動・削除された可能性があります。
        </p>
        <div className='mt-7 flex flex-col items-center gap-3'>
          <Link href='/' className={ctaPrimary}>
            トップへ戻る
          </Link>
          <Link
            href='/events'
            className='text-xs font-semibold text-[#8b7355] underline-offset-2 hover:underline'
          >
            イベント一覧を見る
          </Link>
        </div>
      </div>
    </ConnectionShell>
  );
}
