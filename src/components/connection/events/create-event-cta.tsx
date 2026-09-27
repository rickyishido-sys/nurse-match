'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { track } from '@/lib/analytics/track';

type Props = {
  className?: string;
  children: ReactNode;
  source?: string;
  style?: CSSProperties;
};

export function CreateEventCta({ className, children, source = 'empty_state', style }: Props) {
  return (
    <Link
      href='/events/create'
      className={className}
      style={style}
      onClick={() => track('empty_state_create_event_click', { source })}
    >
      {children}
    </Link>
  );
}
