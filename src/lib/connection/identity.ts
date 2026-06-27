// HANAKAI Connection — viewer identity resolver.
//
// Identity method: B. Anonymous Sign-In.
//   - mock backend:     固定の 'm1'（既存挙動を維持）
//   - supabase backend: Supabase Auth の user を真実とする。
//       * 読み取り (getViewerMemberId): セッションが無ければ null（ゲスト閲覧）。
//       * 書き込み (ensureViewerMemberId): セッションが無ければ匿名サインインで
//         作成し、hanakai_members 行を get-or-create して member id を返す。
// 後からメール認証・本人確認へ「昇格」できる（auth_user_id は不変のまま）。
import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const MOCK_VIEWER_ID = 'm1';

const useSupabase = HANAKAI_CONNECTION_BACKEND === 'supabase';

async function findMemberIdByAuthUser(authUserId: string): Promise<string | null> {
  const admin = createAdminSupabaseClient();
  const sb = admin ?? (await createServerSupabaseClient());
  if (!sb) return null;
  const { data } = await sb
    .from('hanakai_members')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * 読み取り専用。セッションを新規作成しない（RSC からの呼び出しでも安全）。
 * mock では常に 'm1'。supabase では未ログイン時 null。
 */
export async function getViewerMemberId(): Promise<string | null> {
  if (!useSupabase) return MOCK_VIEWER_ID;
  try {
    const sb = await createServerSupabaseClient();
    if (!sb) return null;
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return null;
    return findMemberIdByAuthUser(user.id);
  } catch {
    return null;
  }
}

/**
 * 書き込み導線（Server Actions）専用。
 * 必要なら匿名サインインでセッションを作り、hanakai_members 行を保証して id を返す。
 * mock では常に 'm1'。
 */
export async function ensureViewerMemberId(): Promise<string | null> {
  if (!useSupabase) return MOCK_VIEWER_ID;
  try {
    const sb = await createServerSupabaseClient();
    if (!sb) return null;

    let {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      const { data, error } = await sb.auth.signInAnonymously();
      if (error) {
        console.error('HANAKAI_ANON_SIGNIN_FAILED', { message: error.message });
        return null;
      }
      user = data.user;
    }
    if (!user) return null;

    const existing = await findMemberIdByAuthUser(user.id);
    if (existing) return existing;

    // 行が無ければ作成（service_role 優先で RLS を気にせず作成）
    const admin = createAdminSupabaseClient();
    const writer = admin ?? sb;
    const fallbackName = user.email ? user.email.split('@')[0] : 'ゲスト';
    const { data, error } = await writer
      .from('hanakai_members')
      .insert({
        auth_user_id: user.id,
        nickname: (user.user_metadata?.nickname as string | undefined) ?? fallbackName,
      })
      .select('id')
      .single();
    if (error) {
      console.error('HANAKAI_MEMBER_CREATE_FAILED', { message: error.message });
      return null;
    }
    return data.id;
  } catch (e) {
    console.error('HANAKAI_ENSURE_MEMBER_FAILED', { error: String(e) });
    return null;
  }
}
