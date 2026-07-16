import { redirect } from 'next/navigation';
import { getMember } from '@/lib/connection/repo';
import { isIdentityVerified } from '@/lib/connection/trust';
import type { ConnectionMember } from '@/lib/connection/types';

export const IDENTITY_SECTION_HASH = 'profile-section-identity';
export const IDENTITY_REQUIRED_PATH = `/my-profile#${IDENTITY_SECTION_HASH}`;

export type EventEligibility = {
  member: ConnectionMember | null;
  isVerified: boolean;
  canCreateEvents: boolean;
  canApplyToEvents: boolean;
  canApproveApplications: boolean;
};

export function getEventEligibility(member: ConnectionMember | null): EventEligibility {
  const isVerified = member ? isIdentityVerified(member) : false;
  return {
    member,
    isVerified,
    canCreateEvents: isVerified,
    canApplyToEvents: isVerified,
    canApproveApplications: isVerified,
  };
}

/** サーバーアクション用 — 未確認なら本人確認セクションへ */
export async function requireIdentityVerifiedMember(memberId: string): Promise<ConnectionMember> {
  const member = await getMember(memberId);
  if (!member || !isIdentityVerified(member)) {
    redirect(IDENTITY_REQUIRED_PATH);
  }
  return member;
}

/** API用 — 未確認なら null */
export async function getIdentityVerifiedMemberOrNull(memberId: string): Promise<ConnectionMember | null> {
  const member = await getMember(memberId);
  if (!member || !isIdentityVerified(member)) return null;
  return member;
}
