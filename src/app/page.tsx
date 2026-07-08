import Link from 'next/link';
import { LandingNav } from '@/components/connection/landing/v2/nav';
import { LandingHeroV2 } from '@/components/connection/landing/v2/hero';
import { LandingStats } from '@/components/connection/landing/v2/stats';
import { LandingHowItWorks } from '@/components/connection/landing/v2/how-it-works';
import { LandingGallery } from '@/components/connection/landing/v2/gallery';
import { LandingThemes } from '@/components/connection/landing/v2/themes';
import { LandingBloomIntro } from '@/components/connection/landing/v2/bloom-intro';
import { LandingRecommend } from '@/components/connection/landing/v2/recommend';
import { LandingSafety } from '@/components/connection/landing/v2/safety';
import { LandingVoices } from '@/components/connection/landing/v2/voices';
import { LandingAppMock } from '@/components/connection/landing/v2/app-mock';
import { LandingSupport } from '@/components/connection/landing/v2/support';
import { LandingCycle } from '@/components/connection/landing/v2/cycle';
import { LandingFaq } from '@/components/connection/landing/v2/faq';
import { LandingFinalCta } from '@/components/connection/landing/v2/final-cta';
import { getHanakaiRegistrationStatus, resolveJoinHref } from '@/lib/connection/registration-status';
import { getHanakaiAdminAccess } from '@/lib/connection/hanakai-admin-access';
import { getHanakaiViewer } from '@/lib/hanakai/session';

export default async function LandingPage() {
  const [registration, adminAccess, viewer] = await Promise.all([
    getHanakaiRegistrationStatus(),
    getHanakaiAdminAccess(),
    getHanakaiViewer(),
  ]);
  const joinHref = resolveJoinHref(registration);

  return (
    <div className='min-h-screen bg-[#faf7f2] text-[#1a1a1a]'>
      <LandingNav joinHref={joinHref} viewer={viewer} />

      <main>
        <LandingHeroV2 joinHref={joinHref} />
        <LandingStats />
        <LandingHowItWorks joinHref={joinHref} />
        <LandingGallery />
        <LandingThemes />
        <LandingBloomIntro />
        <LandingRecommend />
        <LandingSafety />
        <LandingVoices />
        <LandingAppMock />
        <LandingSupport />
        <LandingCycle />
        <LandingFaq />
        <LandingFinalCta joinHref={joinHref} />
      </main>

      <footer className='bg-[#163f35] px-6 py-14 text-center text-white'>
        <div className='mx-auto w-full max-w-[1080px]'>
          <p className='text-[15px] font-semibold tracking-[0.2em]'>HANAKAI</p>
          <p className='mt-1 text-[10px] font-medium tracking-[0.34em] text-white/60'>花 会</p>
          <p className='mx-auto mt-5 max-w-[34ch] text-xs leading-[1.9] text-white/70'>
            体験を通じて、人と出会い、人生を豊かにする。
            <br />
            普段出会わない人とつながる、新しいコミュニティ。
          </p>
          <div className='mt-7 flex flex-wrap items-center justify-center gap-5 text-xs text-white/80'>
            <Link href='/events' className='underline-offset-4 hover:underline'>
              イベント
            </Link>
            <Link href='/register' className='underline-offset-4 hover:underline'>
              参加登録
            </Link>
            <Link href='/terms' className='underline-offset-4 hover:underline'>
              利用規約
            </Link>
            <Link href='/privacy' className='underline-offset-4 hover:underline'>
              プライバシーポリシー
            </Link>
            <Link href='/contact' className='underline-offset-4 hover:underline'>
              お問い合わせ
            </Link>
            {adminAccess.allowed ? (
              <Link href='/manage' className='text-white/50 underline-offset-4 hover:underline'>
                運営
              </Link>
            ) : null}
          </div>
          <p className='mt-8 text-[10px] tracking-wide text-white/40'>© {new Date().getFullYear()} HANAKAI</p>
        </div>
      </footer>
    </div>
  );
}
