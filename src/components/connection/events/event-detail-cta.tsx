'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

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

    const anchor = document.getElementById('event-primary-cta');
    if (!anchor) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -80px 0px' },
    );
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [variant]);

  function scrollToApply() {
    document.getElementById(applySectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const buttonClass =
    'flex h-12 w-full items-center justify-center rounded-full bg-[#1f5d4f] px-6 text-sm font-semibold text-white shadow-lg transition active:scale-[0.98]';

  const content = canApply ? (
    <button type='button' onClick={scrollToApply} className={buttonClass}>
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
          showSticky ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-hidden={!showSticky}
      >
        {content}
      </div>
    );
  }

  return <div id='event-primary-cta'>{content}</div>;
}
