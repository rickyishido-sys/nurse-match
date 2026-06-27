import Link from 'next/link';
import { HeroSlider } from '@/components/connection/landing/hero-slider';

export function LandingHero() {
  return (
    <section className='relative -mx-5 -mt-6 min-h-[70vh] overflow-hidden lg:min-h-[80vh]'>
      <HeroSlider />

      <div className='relative flex min-h-[70vh] flex-col justify-center px-5 py-10 lg:min-h-[80vh] lg:px-10'>
        <div className='max-w-[340px] lg:max-w-[480px]'>
          <h1 className='font-serif text-[1.5rem] font-semibold leading-[1.35] tracking-tight text-white sm:text-[1.65rem] lg:text-[2rem]'>
            人と人との
            <br />
            新しいConnectionを
            <br />
            生み出す
          </h1>

          <p className='mt-3 text-[13px] leading-6 text-white/90 lg:text-sm'>
            リアルで出会い、理解が深まり、一生のつながりへ。
          </p>

          <p className='mt-2 text-[11px] leading-5 text-white/75 lg:text-xs'>
            HANAKAI Connectionは、偶然と共感から始まるリアル体験プラットフォームです。
          </p>

          <div className='mt-6 flex max-w-[320px] gap-2.5 lg:max-w-[360px]'>
            <Link
              href='/register/profile'
              className='flex h-10 flex-1 items-center justify-center rounded-full bg-[#1f5d4f] px-3 text-[11px] font-semibold text-white transition active:scale-[0.98] lg:h-11 lg:text-xs'
            >
              参加登録する
            </Link>
            <Link
              href='/events'
              className='flex h-10 flex-1 items-center justify-center rounded-full border border-white/60 bg-white/10 px-3 text-[11px] font-semibold text-white backdrop-blur-sm transition active:scale-[0.98] lg:h-11 lg:text-xs'
            >
              イベントを見る ›
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
