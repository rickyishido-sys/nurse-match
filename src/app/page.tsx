import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { LandingCategoryCards } from '@/components/connection/landing/category-cards';
import { LandingFlowSteps } from '@/components/connection/landing/flow-steps';
import { LandingHero } from '@/components/connection/landing/hero';
import { LandingSafetyCard } from '@/components/connection/landing/safety-card';
import { getHanakaiViewer } from '@/lib/hanakai/session';

export default async function LandingPage() {
  const viewer = await getHanakaiViewer();

  return (
    <ConnectionShell viewer={viewer} showNav={false} flushMain>
      <div className='space-y-12 pb-6'>
        <LandingHero />
        <LandingCategoryCards />
        <LandingFlowSteps />
        <LandingSafetyCard />
      </div>
    </ConnectionShell>
  );
}
