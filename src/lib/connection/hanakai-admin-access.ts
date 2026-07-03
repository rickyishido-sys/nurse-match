import { getViewerMemberId } from '@/lib/connection/identity';
import { isConnectionAdminMember } from '@/lib/connection/group-access';

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
