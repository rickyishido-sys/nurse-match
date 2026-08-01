import dynamic from 'next/dynamic';
import { BrandFooter } from '@/components/connection/brand/brand-footer';
import { LandingConnectionDefinition } from '@/components/connection/landing/v2/connection-definition';
import { LandingNav } from '@/components/connection/landing/v2/nav';
import { LandingHeroV2 } from '@/components/connection/landing/v2/hero';
import { LandingStats } from '@/components/connection/landing/v2/stats';
import { LandingHostEvents } from '@/components/connection/landing/v2/host-events';
import { LandingHowItWorks } from '@/components/connection/landing/v2/how-it-works';
import { LandingBloomIntro } from '@/components/connection/landing/v2/bloom-intro';
import { LandingRecommend } from '@/components/connection/landing/v2/recommend';
import { LandingSafety } from '@/components/connection/landing/v2/safety';
import { LandingFaq } from '@/components/connection/landing/v2/faq';
import { LandingFinalCta } from '@/components/connection/landing/v2/final-cta';
import { PageSkeleton } from '@/components/connection/ui/page-skeleton';
import { getHanakaiRegistrationStatus, resolveJoinHref } from '@/lib/connection/registration-status';
import { getHanakaiAdminAccess } from '@/lib/connection/hanakai-admin-access';
import { HANAKAI_ADMIN_CONSOLE_HREF } from '@/lib/connection/layout-width';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import {
  HERO_MOBILE_VIDEOS,
  HERO_PC_VIDEOS,
  pickRandomHeroVideo,
} from '@/lib/connection/landing/hero-videos';

const sectionFallback = () => (
  <div className='px-6 py-16'>
    <PageSkeleton lines={3} />
  </div>
);

const LandingGallery = dynamic(
  () => import('@/components/connection/landing/v2/gallery').then((m) => ({ default: m.LandingGallery })),
  { loading: sectionFallback },
);
const LandingThemes = dynamic(
  () => import('@/components/connection/landing/v2/themes').then((m) => ({ default: m.LandingThemes })),
  { loading: sectionFallback },
);
const LandingVoices = dynamic(
  () => import('@/components/connection/landing/v2/voices').then((m) => ({ default: m.LandingVoices })),
  { loading: sectionFallback },
);
const LandingAppMock = dynamic(
  () => import('@/components/connection/landing/v2/app-mock').then((m) => ({ default: m.LandingAppMock })),
  { loading: sectionFallback },
);
const LandingCycle = dynamic(
  () => import('@/components/connection/landing/v2/cycle').then((m) => ({ default: m.LandingCycle })),
  { loading: sectionFallback },
);

export default async function LandingPage() {
  const [registration, adminAccess, viewer] = await Promise.all([
    getHanakaiRegistrationStatus(),
    getHanakaiAdminAccess(),
    getHanakaiViewer(),
  ]);
  const joinHref = resolveJoinHref(registration);
  const pcVideo = pickRandomHeroVideo(HERO_PC_VIDEOS);
  const mobileVideo = pickRandomHeroVideo(HERO_MOBILE_VIDEOS);

  return (
    <div className='min-h-screen hk-vibrant-gradient text-[#1a1a1a]'>
      <link rel='preload' as='image' href='/images/avatars/aoi.webp' type='image/webp' />

      <LandingNav joinHref={joinHref} viewer={viewer} />

      <main>
        <LandingHeroV2 joinHref={joinHref} pcVideo={pcVideo} mobileVideo={mobileVideo} />
        <LandingConnectionDefinition />
        <LandingHostEvents />
        <LandingStats />
        <LandingHowItWorks joinHref={joinHref} />
        <LandingGallery />
        <LandingThemes />
        <LandingBloomIntro joinHref={joinHref} viewer={viewer} />
        <LandingRecommend />
        <LandingSafety />
        <LandingVoices />
        <LandingAppMock />
        <LandingCycle />
        <LandingFaq />
        <LandingFinalCta joinHref={joinHref} />
      </main>

      <BrandFooter adminHref={adminAccess.allowed ? HANAKAI_ADMIN_CONSOLE_HREF : null} />
    </div>
  );
}
