import { getApplication, getEvent } from '@/lib/connection/repo';
import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import * as mock from '@/lib/connection/group-data';

/** 運営管理者としてグループにアクセスできるメンバーID */
export function isConnectionAdminMember(memberId: string | null): boolean {
  if (!memberId) return false;
  const ids = (process.env.HANAKAI_CONNECTION_ADMIN_MEMBER_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.includes(memberId)) return true;
  if (HANAKAI_CONNECTION_BACKEND !== 'supabase' && memberId === 'm1') return true;
  return false;
}

export async function canAccessGroup(
  eventId: string,
  viewerMemberId: string | null,
): Promise<{ ok: boolean; isAdmin: boolean }> {
  if (!viewerMemberId) return { ok: false, isAdmin: false };
  const isAdmin = isConnectionAdminMember(viewerMemberId);
  if (isAdmin) return { ok: true, isAdmin: true };

  if (HANAKAI_CONNECTION_BACKEND !== 'supabase') {
    return { ok: mock.mockCanAccessGroup(eventId, viewerMemberId, false), isAdmin: false };
  }

  const event = await getEvent(eventId);
  if (!event) return { ok: false, isAdmin: false };
  if (event.hostId === viewerMemberId) return { ok: true, isAdmin: false };
  const app = await getApplication(eventId, viewerMemberId);
  if (app?.status === 'confirmed') return { ok: true, isAdmin: false };
  return { ok: false, isAdmin: false };
}
