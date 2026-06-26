import type {
  AdminEventStatus,
  HostStatus,
  UserStatus,
  VerificationStatus,
} from '@/lib/connection/admin-types';
import {
  ADMIN_EVENT_STATUS_LABEL,
  HOST_STATUS_LABEL,
  USER_STATUS_LABEL,
  VERIFICATION_LABEL,
} from '@/lib/connection/admin-data';

export type Tone = 'green' | 'greenStrong' | 'amber' | 'red' | 'redSoft' | 'gray' | 'beige';

const toneClass: Record<Tone, string> = {
  green: 'border-[#bcdacb] bg-[#eef6f1] text-[#1f5d4f]',
  greenStrong: 'border-transparent bg-[#1f5d4f] text-white',
  amber: 'border-[#ecd9a8] bg-[#fbf3df] text-[#8a6a2b]',
  red: 'border-[#e7b9b9] bg-[#fbeeee] text-[#a23b3b]',
  redSoft: 'border-[#eccaba] bg-[#fbf0ea] text-[#a8602f]',
  gray: 'border-[#e2ddd2] bg-[#f5f3ee] text-[#6b6b6b]',
  beige: 'border-[#e3d9c4] bg-[#fbf7ee] text-[#7a5f2e]',
};

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}

const verificationTone: Record<VerificationStatus, Tone> = {
  unverified: 'gray',
  reviewing: 'amber',
  verified: 'green',
  assured: 'greenStrong',
  rejected: 'red',
};
export function VerificationBadge({ value }: { value: VerificationStatus }) {
  return <Badge tone={verificationTone[value]}>{VERIFICATION_LABEL[value]}</Badge>;
}

const userStatusTone: Record<UserStatus, Tone> = {
  active: 'green',
  review: 'amber',
  suspended: 'redSoft',
  banned: 'red',
};
export function UserStatusBadge({ value }: { value: UserStatus }) {
  return <Badge tone={userStatusTone[value]}>{USER_STATUS_LABEL[value]}</Badge>;
}

const hostStatusTone: Record<HostStatus, Tone> = {
  none: 'gray',
  applied: 'amber',
  community: 'green',
  trusted: 'greenStrong',
  premium: 'beige',
  suspended: 'redSoft',
  rejected: 'red',
};
export function HostStatusBadge({ value }: { value: HostStatus }) {
  return <Badge tone={hostStatusTone[value]}>{HOST_STATUS_LABEL[value]}</Badge>;
}

const eventStatusTone: Record<AdminEventStatus, Tone> = {
  draft: 'gray',
  under_review: 'amber',
  published: 'green',
  returned: 'redSoft',
  unpublished: 'gray',
  completed: 'beige',
};
export function EventStatusBadge({ value }: { value: AdminEventStatus }) {
  return <Badge tone={eventStatusTone[value]}>{ADMIN_EVENT_STATUS_LABEL[value]}</Badge>;
}

export function AdminCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#ebe7dd] bg-white p-5 shadow-[0_1px_8px_rgba(31,93,79,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function AdminPageHeader({
  kicker,
  title,
  description,
}: {
  kicker?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className='space-y-2'>
      {kicker ? <p className='text-xs font-semibold tracking-[0.18em] text-[#1f5d4f]'>{kicker}</p> : null}
      <h1 className='text-xl font-semibold text-[#1a1a1a]'>{title}</h1>
      {description ? <p className='text-sm leading-7 text-[#6b6b6b]'>{description}</p> : null}
    </div>
  );
}

export function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <article className='rounded-2xl border border-[#ebe7dd] bg-white p-4 shadow-[0_1px_8px_rgba(31,93,79,0.04)]'>
      <p className='text-[11px] leading-5 text-[#6b6b6b]'>{label}</p>
      <p className='mt-1 text-2xl font-semibold text-[#1f5d4f]'>{value}</p>
      {hint ? <p className='mt-0.5 text-[11px] text-[#9a9a9a]'>{hint}</p> : null}
    </article>
  );
}

export function FlashBanner({ children }: { children: React.ReactNode }) {
  return (
    <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-xs text-[#1f5d4f]'>{children}</p>
  );
}
