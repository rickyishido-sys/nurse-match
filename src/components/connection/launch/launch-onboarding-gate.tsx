'use client';

import { useEffect, useState } from 'react';
import { track } from '@/lib/analytics/track';
import {
  hasSeenLaunchOnboarding,
  markLaunchOnboardingSeen,
} from '@/lib/connection/launch-onboarding';
import { LaunchOnboardingModal } from '@/components/connection/launch/launch-onboarding-modal';

type Props = {
  isAuthenticated: boolean;
};

export function LaunchOnboardingGate({ isAuthenticated }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setOpen(false);
      return;
    }
    if (hasSeenLaunchOnboarding()) {
      setOpen(false);
      return;
    }
    setOpen(true);
    track('launch_modal_view');
  }, [isAuthenticated]);

  if (isAuthenticated || !open) return null;

  function dismiss() {
    markLaunchOnboardingSeen();
    setOpen(false);
  }

  return (
    <LaunchOnboardingModal
      onSignup={() => {
        track('launch_modal_signup_click');
        dismiss();
      }}
      onLater={() => {
        track('launch_modal_later_click');
        dismiss();
      }}
    />
  );
}
