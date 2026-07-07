import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHanakaiMemberIdForAuthUser } from '@/lib/connection/identity';
import { isConnectionAdminMember } from '@/lib/connection/group-access';
import { getMember } from '@/lib/connection/repo';

export type HanakaiUserRole = 'super_admin' | 'connection_admin' | 'user';

export type HanakaiViewer = {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: HanakaiUserRole;
  /** @deprecated use role === 'connection_admin' */
  isConnectionAdmin: boolean;
};

async function isSuperAdminUser(authUserId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;
  const { data } = await supabase.from('users').select('role').eq('id', authUserId).maybeSingle();
  return data?.role === 'super_admin';
}

function resolveHanakaiUserRole(isSuperAdmin: boolean, memberId: string | null): HanakaiUserRole {
  if (isSuperAdmin) return 'super_admin';
  if (isConnectionAdminMember(memberId)) return 'connection_admin';
  return 'user';
}

function resolveAvatarUrl(member: Awaited<ReturnType<typeof getMember>>): string | null {
  if (!member) return null;
  if (member.avatarUrl?.trim()) return member.avatarUrl;
  const firstPhoto = member.photos.find((photo) => photo.url?.trim());
  return firstPhoto?.url ?? null;
}

// Lightweight auth read for the HANAKAI shell. Decoupled from the legacy
// dating-domain `users` table; only used to show login/logout state.
export async function getHanakaiViewer(): Promise<HanakaiViewer | null> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return null;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const email = user.email ?? null;
    const metaName = (user.user_metadata?.nickname as string | undefined) ?? null;
    const memberId = await getHanakaiMemberIdForAuthUser(user.id);
    const member = memberId ? await getMember(memberId) : null;
    const isSuperAdmin = await isSuperAdminUser(user.id);
    const role = resolveHanakaiUserRole(isSuperAdmin, memberId);
    const displayName =
      member?.nickname?.trim() || metaName?.trim() || (email ? email.split('@')[0] : 'ゲスト');

    return {
      id: user.id,
      email,
      displayName,
      avatarUrl: resolveAvatarUrl(member),
      role,
      isConnectionAdmin: role === 'connection_admin' || role === 'super_admin',
    };
  } catch {
    return null;
  }
}
