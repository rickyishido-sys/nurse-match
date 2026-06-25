import Link from 'next/link';
import { CoverImage } from '@/components/connection/landing/cover-image';
import { LANDING_HERO_IMAGE } from '@/lib/connection/data';

export function LandingHero() {
  return (
    <section className='relative -mx-5 -mt-6 min-h-[500px] overflow-hidden'>
      <CoverImage
        src={LANDING_HERO_IMAGE}
        alt='HANAKAI Connection — 人と人が集まるリアル体験'
        fallbackClassName='bg-gradient-to-br from-[#4a4038] via-[#2e2824] to-[#1a1614]'
        priority
      />
      <div className='absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-black/20' aria-hidden />
      <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30' aria-hidden />

      <div className='relative flex min-h-[500px] flex-col justify-end px-5 pb-10 pt-20'>
        <h1 className='font-serif text-[1.75rem] font-semibold leading-[1.3] tracking-tight text-white'>
          人と人との
          <br />
          新しいConnectionを
          <br />
          生み出す
        </h1>

        <p className='mt-4 text-sm leading-7 text-white/92'>
          リアルで出会い、理解が深まり、
          <br />
          一生のつながりへ。
        </p>

        <p className='mt-3 text-xs leading-6 text-white/78'>
          HANAKAI Connectionは、偶然と共感から始まるリアル体験プラットフォームです。
        </p>

        <div className='mt-7 flex gap-2'>
          <Link
            href='/register'
            className='flex h-11 flex-1 items-center justify-center rounded-full bg-[#1a1a1a] text-xs font-semibold text-white shadow-lg transition active:scale-[0.98]'
          >
            参加登録する
          </Link>
          <Link
            href='/events'
            className='flex h-11 flex-1 items-center justify-center rounded-full border border-white/70 bg-white/10 text-xs font-semibold text-white backdrop-blur-sm transition active:scale-[0.98]'
          >
            イベントを見る ›
          </Link>
        </div>
      </div>
    </section>
  );
}
