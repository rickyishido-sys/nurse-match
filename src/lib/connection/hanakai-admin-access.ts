import { getViewerMemberId } from '@/lib/connection/identity';
import { isConnectionAdminMember } from '@/lib/connection/group-access';
import { redirect } from 'next/navigation';

export { isHanakaiAdminPath } from '@/lib/connection/hanakai-admin-path';
export { isConnectionAdminMember as isHanakaiConnectionAdmin };

export type HanakaiAdminAccessReason = 'ok' | 'no_session' | 'not_admin';

export type HanakaiAdminAccess = {
  allowed: boolean;
  memberId: string | null;
  reason: HanakaiAdminAccessReason;
};

/** HANAKAI 運営管理画面（/admin/hanakai）のアクセス判定 */
export async function getHanakaiAdminAccess(): Promise<HanakaiAdminAccess> {
  const memberId = await getViewerMemberId();
  if (!memberId) {
    return { allowed: false, memberId: null, reason: 'no_session' };
  }
  if (!isConnectionAdminMember(memberId)) {
    return { allowed: false, memberId, reason: 'not_admin' };
  }
  return { allowed: true, memberId, reason: 'ok' };
}

/** /manage など運営専用導線 — 未認証は login、非管理者は home へ */
export async function requireHanakaiAdminAccess(returnPath = '/manage'): Promise<string> {
  const access = await getHanakaiAdminAccess();
  if (access.reason === 'no_session') {
    redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  }
  if (!access.allowed) {
    console.warn('HANAKAI_MANAGE_ACCESS_DENIED', { reason: access.reason, memberId: access.memberId });
    redirect('/home');
  }
  return access.memberId!;
}
