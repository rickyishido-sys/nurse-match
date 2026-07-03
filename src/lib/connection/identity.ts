// HANAKAI Connection — viewer identity resolver.
//
// 正規フロー（本番）:
//   Supabase Auth user → hanakai_members.auth_user_id → hanakai_members.id (member_id)
//
// - mock backend:     固定の 'm1'（既存挙動を維持）
// - supabase backend: Supabase Auth の user を真実とする。
//       * 読み取り (getViewerMemberId): セッションが無ければ null（ゲスト閲覧）。
//       * 書き込み (ensureViewerMemberId): セッション必須（本番は匿名 sign-in 不可）。
//         ensureHanakaiMemberForAuthUser で hanakai_members 行を get-or-create。
import { HANAKAI_CONNECTION_BACKEND, HANAKAI_DISABLE_ANONYMOUS_AUTH } from '@/lib/config';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const MOCK_VIEWER_ID = 'm1';

const useSupabase = HANAKAI_CONNECTION_BACKEND === 'supabase';

function isAnonymousAuthAllowed(): boolean {
  if (HANAKAI_DISABLE_ANONYMOUS_AUTH) return false;
  return process.env.HANAKAI_ALLOW_ANONYMOUS_AUTH === 'true';
}

async function findMemberIdByAuthUser(authUserId: string): Promise<string | null> {
  const sb = await createServerSupabaseClient();
  if (!sb) return null;
  const { data } = await sb
    .from('hanakai_members')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  return data?.id ?? null;
}

function fallbackNickname(email: string | null | undefined, metadataNickname?: string | null): string {
  if (metadataNickname?.trim()) return metadataNickname.trim();
  if (email?.trim()) return email.split('@')[0] ?? 'ゲスト';
  return 'ゲスト';
}

/**
 * 認証済み auth user に対応する hanakai_members 行を get-or-create する。
 * 既存 member_id / auth_user_id は変更・削除しない。
 */
export async function ensureHanakaiMemberForAuthUser(
  authUserId: string,
  options?: { email?: string | null; nickname?: string | null },
): Promise<string | null> {
  if (!useSupabase) return MOCK_VIEWER_ID;

  try {
    const existing = await findMemberIdByAuthUser(authUserId);
    if (existing) return existing;

    const sb = await createServerSupabaseClient();
    if (!sb) return null;

    const nickname = fallbackNickname(options?.email, options?.nickname);
    const { data, error } = await sb
      .from('hanakai_members')
      .insert({
        auth_user_id: authUserId,
        nickname,
      })
      .select('id')
      .single();

    if (error) {
      // 競合（同時 insert）時は再取得
      if (error.code === '23505') {
        return findMemberIdByAuthUser(authUserId);
      }
      console.error('HANAKAI_MEMBER_CREATE_FAILED', { message: error.message, authUserId });
      return null;
    }
    return data.id;
  } catch (e) {
    console.error('HANAKAI_ENSURE_MEMBER_FOR_AUTH_FAILED', { authUserId, error: String(e) });
    return null;
  }
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

/** ログイン済みか（Supabase Auth セッションあり） */
export async function getAuthenticatedAuthUserId(): Promise<string | null> {
  if (!useSupabase) return MOCK_VIEWER_ID;
  try {
    const sb = await createServerSupabaseClient();
    if (!sb) return null;
    const {
      data: { user },
    } = await sb.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * 書き込み導線（Server Actions）専用。
 * セッションがある場合は ensureHanakaiMemberForAuthUser で member id を返す。
 * 本番（HANAKAI_DISABLE_ANONYMOUS_AUTH）ではセッションなし → null。
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
      if (!isAnonymousAuthAllowed()) {
        return null;
      }
      const { data, error } = await sb.auth.signInAnonymously();
      if (error) {
        console.error('HANAKAI_ANON_SIGNIN_FAILED', { message: error.message });
        return null;
      }
      user = data.user;
    }
    if (!user) return null;

    return ensureHanakaiMemberForAuthUser(user.id, {
      email: user.email,
      nickname: (user.user_metadata?.nickname as string | undefined) ?? null,
    });
  } catch (e) {
    console.error('HANAKAI_ENSURE_MEMBER_FAILED', { error: String(e) });
    return null;
  }
}
