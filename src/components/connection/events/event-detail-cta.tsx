'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export const HANAKAI_START_APPLY_EVENT = 'hanakai:start-apply';

type Props = {
  applySectionId: string;
  loginHref: string;
  canApply: boolean;
  label?: string;
  variant?: 'inline' | 'sticky';
};

export function EventDetailCta({
  applySectionId,
  loginHref,
  canApply,
  label = '参加する',
  variant = 'inline',
}: Props) {
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    if (variant !== 'sticky') return;

    const primary = document.getElementById('event-primary-cta');
    const apply = document.getElementById(applySectionId);
    if (!primary) return;

    let primaryVisible = true;
    let applyVisible = false;

    const sync = () => {
      // Hide sticky while the apply section is on screen so it does not cover
      // the form or create a scroll loop back to the section header.
      setShowSticky(!primaryVisible && !applyVisible);
    };

    const primaryObserver = new IntersectionObserver(
      ([entry]) => {
        primaryVisible = entry.isIntersecting;
        sync();
      },
      { threshold: 0, rootMargin: '0px 0px -80px 0px' },
    );
    primaryObserver.observe(primary);

    let applyObserver: IntersectionObserver | null = null;
    if (apply) {
      applyObserver = new IntersectionObserver(
        ([entry]) => {
          applyVisible = entry.isIntersecting;
          sync();
        },
        { threshold: 0.12, rootMargin: '0px 0px -20% 0px' },
      );
      applyObserver.observe(apply);
    }

    return () => {
      primaryObserver.disconnect();
      applyObserver?.disconnect();
    };
  }, [variant, applySectionId]);

  function startApply() {
    window.dispatchEvent(new CustomEvent(HANAKAI_START_APPLY_EVENT));
    const section = document.getElementById(applySectionId);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Focus reason field after the form expands / paints.
    window.setTimeout(() => {
      const reason = document.getElementById('reason') as HTMLTextAreaElement | null;
      reason?.focus({ preventScroll: true });
    }, 350);
  }

  const buttonClass =
    'flex h-12 w-full items-center justify-center rounded-full bg-[#1f5d4f] px-6 text-sm font-semibold text-white shadow-lg transition active:scale-[0.98]';

  const content = canApply ? (
    <button type='button' onClick={startApply} className={buttonClass}>
      {label}
    </button>
  ) : (
    <Link href={loginHref} className={buttonClass}>
      {label}
    </Link>
  );

  if (variant === 'sticky') {
    return (
      <div
        className={`fixed inset-x-0 bottom-[4.5rem] z-30 border-t border-[#ebe9e4] bg-[#fafaf8]/95 px-5 py-3 backdrop-blur transition-transform duration-300 lg:hidden ${
          showSticky ? 'translate-y-0' : 'pointer-events-none translate-y-full'
        }`}
        aria-hidden={!showSticky}
      >
        {content}
      </div>
    );
  }

  return <div id='event-primary-cta'>{content}</div>;
}
