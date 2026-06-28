import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { uploadGroupPhotos } from '@/lib/connection/group-storage';
import type {
  ConnectionGroup,
  GroupMemberRole,
  GroupPhoto,
  GroupPhotoUsageRequest,
  GroupPhotoUsageScope,
  GroupPost,
} from '@/lib/connection/types';

/** 認証済みセッションを優先。service_role が無効な本番環境でも RLS 経由で動作する。 */
async function db() {
  const user = await createServerSupabaseClient();
  if (user) return user;
  return createAdminSupabaseClient();
}

function groupFromRow(row: Record<string, unknown>): ConnectionGroup {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    createdAt: String(row.created_at),
  };
}

function postFromRow(row: Record<string, unknown>): GroupPost {
  return {
    id: String(row.id),
    groupId: String(row.group_id),
    memberId: String(row.member_id),
    body: String(row.body ?? ''),
    isHidden: Boolean(row.is_hidden),
    reportCount: Number(row.report_count ?? 0),
    createdAt: String(row.created_at),
  };
}

function photoFromRow(row: Record<string, unknown>): GroupPhoto {
  return {
    id: String(row.id),
    groupId: String(row.group_id),
    memberId: String(row.member_id),
    postId: row.post_id ? String(row.post_id) : undefined,
    url: String(row.url),
    storagePath: String(row.storage_path ?? ''),
    usageStatus: (row.usage_status as GroupPhoto['usageStatus']) ?? 'private',
    isHidden: Boolean(row.is_hidden),
    reportCount: Number(row.report_count ?? 0),
    consentAcknowledged: Boolean(row.consent_acknowledged),
    createdAt: String(row.created_at),
  };
}

export async function getGroupByEventId(eventId: string): Promise<ConnectionGroup | null> {
  const sb = await db();
  if (!sb) return null;
  const { data, error } = await sb.from('hanakai_connection_groups').select('*').eq('event_id', eventId).maybeSingle();
  if (error) console.error('HANAKAI_GROUP_GET_FAILED', { eventId, message: error.message });
  return data ? groupFromRow(data) : null;
}

export async function ensureGroupForEvent(eventId: string): Promise<ConnectionGroup | null> {
  const existing = await getGroupByEventId(eventId);
  if (existing) return existing;
  const sb = await db();
  if (!sb) return null;
  const { data, error } = await sb.from('hanakai_connection_groups').insert({ event_id: eventId }).select('*').single();
  if (error) {
    console.error('HANAKAI_GROUP_ENSURE_FAILED', { eventId, message: error.message });
    return null;
  }
  return data ? groupFromRow(data) : null;
}

export async function addGroupMember(groupId: string, memberId: string, role: GroupMemberRole) {
  const sb = await db();
  if (!sb) return;
  const { error } = await sb.from('hanakai_group_members').upsert(
    { group_id: groupId, member_id: memberId, role },
    { onConflict: 'group_id,member_id' },
  );
  if (error) console.error('HANAKAI_GROUP_MEMBER_ADD_FAILED', { groupId, memberId, message: error.message });
}

export async function syncGroupForConfirmedMember(
  eventId: string,
  memberId: string,
  role: GroupMemberRole = 'participant',
) {
  const group = await ensureGroupForEvent(eventId);
  if (!group) return;
  await addGroupMember(group.id, memberId, role);
}

export async function syncGroupHost(eventId: string, hostMemberId: string) {
  await syncGroupForConfirmedMember(eventId, hostMemberId, 'host');
}

export async function listGroupMemberIds(groupId: string): Promise<string[]> {
  const sb = await db();
  if (!sb) return [];
  const { data, error } = await sb.from('hanakai_group_members').select('member_id').eq('group_id', groupId);
  if (error) console.error('HANAKAI_GROUP_MEMBERS_LIST_FAILED', { groupId, message: error.message });
  return (data ?? []).map((r) => String(r.member_id));
}

export async function listGroupPosts(groupId: string): Promise<GroupPost[]> {
  const sb = await db();
  if (!sb) return [];
  const { data, error } = await sb
    .from('hanakai_group_posts')
    .select('*')
    .eq('group_id', groupId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false });
  if (error) console.error('HANAKAI_GROUP_POSTS_LIST_FAILED', { groupId, message: error.message });
  return (data ?? []).map(postFromRow);
}

export async function listGroupPhotos(groupId: string): Promise<GroupPhoto[]> {
  const sb = await db();
  if (!sb) return [];
  const { data, error } = await sb
    .from('hanakai_group_photos')
    .select('*')
    .eq('group_id', groupId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false });
  if (error) console.error('HANAKAI_GROUP_PHOTOS_LIST_FAILED', { groupId, message: error.message });
  return (data ?? []).map(photoFromRow);
}

export async function createGroupPost(groupId: string, memberId: string, body: string): Promise<GroupPost | null> {
  const sb = await db();
  if (!sb) return null;
  const { data, error } = await sb
    .from('hanakai_group_posts')
    .insert({ group_id: groupId, member_id: memberId, body })
    .select('*')
    .single();
  if (error) {
    console.error('HANAKAI_GROUP_POST_CREATE_FAILED', { groupId, message: error.message });
    return null;
  }
  return data ? postFromRow(data) : null;
}

export async function createGroupPhotosFromFiles(
  groupId: string,
  memberId: string,
  files: File[],
  postId?: string,
): Promise<GroupPhoto[]> {
  const uploaded = await uploadGroupPhotos(groupId, files);
  if (uploaded.length === 0) return [];
  const sb = await db();
  if (!sb) return [];
  const rows = uploaded.map((u) => ({
    group_id: groupId,
    member_id: memberId,
    post_id: postId ?? null,
    storage_path: u.storagePath,
    url: u.url,
    usage_status: 'private',
    consent_acknowledged: true,
  }));
  const { data, error } = await sb.from('hanakai_group_photos').insert(rows).select('*');
  if (error) {
    console.error('HANAKAI_GROUP_PHOTO_INSERT_FAILED', { groupId, message: error.message });
    return [];
  }
  return (data ?? []).map(photoFromRow);
}

export async function reportGroupPost(postId: string) {
  const sb = await db();
  if (!sb) return;
  const { data } = await sb.from('hanakai_group_posts').select('report_count').eq('id', postId).maybeSingle();
  if (!data) return;
  const { error } = await sb.from('hanakai_group_posts').update({ report_count: Number(data.report_count ?? 0) + 1 }).eq('id', postId);
  if (error) console.error('HANAKAI_GROUP_POST_REPORT_FAILED', { postId, message: error.message });
}

export async function reportGroupPhoto(photoId: string) {
  const sb = await db();
  if (!sb) return;
  const { data } = await sb.from('hanakai_group_photos').select('report_count').eq('id', photoId).maybeSingle();
  if (!data) return;
  const { error } = await sb
    .from('hanakai_group_photos')
    .update({ report_count: Number(data.report_count ?? 0) + 1, usage_status: 'reported' })
    .eq('id', photoId);
  if (error) console.error('HANAKAI_GROUP_PHOTO_REPORT_FAILED', { photoId, message: error.message });
}

export async function hideGroupPost(postId: string) {
  const sb = await db();
  if (!sb) return;
  const { error } = await sb.from('hanakai_group_posts').update({ is_hidden: true }).eq('id', postId);
  if (error) console.error('HANAKAI_GROUP_POST_HIDE_FAILED', { postId, message: error.message });
}

export async function hideGroupPhoto(photoId: string) {
  const sb = await db();
  if (!sb) return;
  const { error } = await sb.from('hanakai_group_photos').update({ is_hidden: true }).eq('id', photoId);
  if (error) console.error('HANAKAI_GROUP_PHOTO_HIDE_FAILED', { photoId, message: error.message });
}

export async function requestPhotoUsage(
  photoId: string,
  scopes: GroupPhotoUsageScope[],
  message: string,
): Promise<GroupPhotoUsageRequest | null> {
  const sb = await db();
  if (!sb) return null;
  const { error: upErr } = await sb.from('hanakai_group_photos').update({ usage_status: 'requested' }).eq('id', photoId);
  if (upErr) {
    console.error('HANAKAI_PHOTO_USAGE_STATUS_FAILED', { photoId, message: upErr.message });
    return null;
  }
  const { data, error } = await sb
    .from('hanakai_group_photo_usage_requests')
    .insert({ photo_id: photoId, scopes, message, status: 'pending' })
    .select('*')
    .single();
  if (error) {
    console.error('HANAKAI_PHOTO_USAGE_REQUEST_FAILED', { photoId, message: error.message });
    return null;
  }
  if (!data) return null;
  return {
    id: String(data.id),
    photoId: String(data.photo_id),
    scopes: (data.scopes ?? []) as GroupPhotoUsageScope[],
    message: String(data.message ?? ''),
    status: data.status as GroupPhotoUsageRequest['status'],
    createdAt: String(data.created_at),
    respondedAt: data.responded_at ? String(data.responded_at) : undefined,
  };
}
