import { BrandFooter } from '@/components/connection/brand/brand-footer';
import { LandingConnectionDefinition } from '@/components/connection/landing/v2/connection-definition';
import { LandingNav } from '@/components/connection/landing/v2/nav';
import { LandingHeroV2 } from '@/components/connection/landing/v2/hero';
import { LandingStats } from '@/components/connection/landing/v2/stats';
import { LandingHostEvents } from '@/components/connection/landing/v2/host-events';
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
    <div className='min-h-screen hk-vibrant-gradient text-[#1a1a1a]'>
      <LandingNav joinHref={joinHref} viewer={viewer} />

      <main>
        <LandingHeroV2 joinHref={joinHref} />
        <LandingConnectionDefinition />
        <LandingHostEvents />
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

      <BrandFooter adminHref={adminAccess.allowed ? '/manage' : null} />
    </div>
  );
}
