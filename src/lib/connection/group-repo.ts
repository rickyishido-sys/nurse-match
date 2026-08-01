// HANAKAI Connection — event group repository (mock | supabase)
import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import * as mock from '@/lib/connection/group-data';
import * as supa from '@/lib/connection/group-repo-supabase';
import { SEED_MEMBER_AVATARS } from '@/lib/connection/mock-profile-assets';
import { getEvent } from '@/lib/connection/repo';
import { isConnectionAdminMember } from '@/lib/connection/group-access';
import type { GroupMemberRole, GroupPhotoUsageScope } from '@/lib/connection/types';

const useSupabase = HANAKAI_CONNECTION_BACKEND === 'supabase';

function adminMemberIds(): string[] {
  const ids = (process.env.HANAKAI_CONNECTION_ADMIN_MEMBER_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!useSupabase && !ids.includes('m1')) ids.push('m1');
  return ids;
}

export async function getGroupByEventId(eventId: string) {
  return useSupabase ? supa.getGroupByEventId(eventId) : mock.getGroupByEventId(eventId);
}

export async function ensureGroupForEvent(eventId: string) {
  return useSupabase ? supa.ensureGroupForEvent(eventId) : mock.ensureGroupForEvent(eventId);
}

export async function addGroupMember(groupId: string, memberId: string, role: GroupMemberRole) {
  if (useSupabase) return supa.addGroupMember(groupId, memberId, role);
  mock.addGroupMember(groupId, memberId, role);
}

/** 主催者・承認済み参加者・管理者をグループに同期 */
export async function refreshGroupMembership(eventId: string) {
  const event = await getEvent(eventId);
  if (!event) return null;
  const group = await ensureGroupForEvent(eventId);
  if (!group) return null;
  if (event.hostId) await addGroupMember(group.id, event.hostId, 'host');
  for (const memberId of event.confirmedMemberIds) {
    await addGroupMember(group.id, memberId, 'participant');
  }
  for (const adminId of adminMemberIds()) {
    if (isConnectionAdminMember(adminId)) {
      await addGroupMember(group.id, adminId, 'admin');
    }
  }
  return group;
}

export async function syncGroupForConfirmedMember(
  eventId: string,
  memberId: string,
  role: GroupMemberRole = 'participant',
) {
  if (useSupabase) return supa.syncGroupForConfirmedMember(eventId, memberId, role);
  mock.syncGroupForConfirmedMember(eventId, memberId, role);
}

export async function syncGroupHost(eventId: string, hostMemberId: string) {
  if (useSupabase) return supa.syncGroupHost(eventId, hostMemberId);
  mock.syncGroupForConfirmedMember(eventId, hostMemberId, 'host');
}

export async function listGroupMemberIds(groupId: string) {
  if (useSupabase) return supa.listGroupMemberIds(groupId);
  return mock.listGroupMembers(groupId).map((m) => m.memberId);
}

export async function listGroupPosts(groupId: string) {
  return useSupabase ? supa.listGroupPosts(groupId) : mock.listGroupPosts(groupId);
}

export async function listGroupPhotos(groupId: string) {
  return useSupabase ? supa.listGroupPhotos(groupId) : mock.listGroupPhotos(groupId);
}

export async function createGroupPost(groupId: string, memberId: string, body: string) {
  return useSupabase ? supa.createGroupPost(groupId, memberId, body) : mock.createGroupPost(groupId, memberId, body);
}

export async function createGroupPhotosFromFiles(
  groupId: string,
  memberId: string,
  files: File[],
  postId?: string,
) {
  if (useSupabase) return supa.createGroupPhotosFromFiles(groupId, memberId, files, postId);
  const urls = files.map(() => SEED_MEMBER_AVATARS.m1);
  return mock.createGroupPhotos(groupId, memberId, urls, postId);
}

export async function reportGroupPost(postId: string, reporterMemberId?: string) {
  if (useSupabase) return supa.reportGroupPost(postId, reporterMemberId);
  mock.reportGroupPost(postId);
}

export async function reportGroupPhoto(photoId: string, reporterMemberId?: string) {
  if (useSupabase) return supa.reportGroupPhoto(photoId, reporterMemberId);
  mock.reportGroupPhoto(photoId);
}

export async function hideGroupPost(postId: string) {
  if (useSupabase) return supa.hideGroupPost(postId);
  mock.hideGroupPost(postId);
}

export async function hideGroupPhoto(photoId: string) {
  if (useSupabase) return supa.hideGroupPhoto(photoId);
  mock.hideGroupPhoto(photoId);
}

export async function requestPhotoUsage(photoId: string, scopes: GroupPhotoUsageScope[], message: string) {
  return useSupabase ? supa.requestPhotoUsage(photoId, scopes, message) : mock.requestPhotoUsage(photoId, scopes, message);
}
