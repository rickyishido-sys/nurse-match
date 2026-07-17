import { getAuthenticatedAuthUserId, getViewerMemberId } from '@/lib/connection/identity';
import { hasRecordedLegalConsent } from '@/lib/connection/legal-consent';
import { isDeletedMember } from '@/lib/connection/member-status';
import { getMember } from '@/lib/connection/repo';
import type { ConnectionMember } from '@/lib/connection/types';

/** Bloom Profile Lite の必須項目が揃っているか */
export function isHanakaiProfileComplete(member: ConnectionMember | null | undefined): boolean {
  if (!member) return false;
  if (!hasRecordedLegalConsent(member)) return false;
  const hasGender = member.gender === 'female' || member.gender === 'male' || member.gender === 'other';
  const hasArea = Boolean(member.area?.trim());
  const hasAgeBand = Boolean(member.ageBand);
  const hasAge = member.age >= 18;
  const hasNickname = Boolean(member.nickname?.trim());
  return hasNickname && hasGender && hasArea && (hasAgeBand || hasAge);
}

export type HanakaiRegistrationStatus = {
  isAuthenticated: boolean;
  profileComplete: boolean;
  member: ConnectionMember | null;
};

export async function getHanakaiRegistrationStatus(): Promise<HanakaiRegistrationStatus> {
  const authUserId = await getAuthenticatedAuthUserId();
  if (!authUserId) {
    return { isAuthenticated: false, profileComplete: false, member: null };
  }

  const memberId = await getViewerMemberId();
  const member = memberId ? await getMember(memberId) : null;
  if (isDeletedMember(member)) {
    return { isAuthenticated: false, profileComplete: false, member: null };
  }
  return {
    isAuthenticated: true,
    profileComplete: isHanakaiProfileComplete(member),
    member,
  };
}

/** 参加導線の遷移先 */
export function resolveJoinHref(status: Pick<HanakaiRegistrationStatus, 'isAuthenticated' | 'profileComplete'>): string {
  if (!status.isAuthenticated) return '/register';
  if (!status.profileComplete) return '/register/profile';
  return '/home';
}
