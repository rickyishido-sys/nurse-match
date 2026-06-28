import { getApplication, getEvent } from '@/lib/connection/data';
import type {
  ConnectionGroup,
  GroupMemberRole,
  GroupPhoto,
  GroupPhotoUsageRequest,
  GroupPhotoUsageScope,
  GroupPost,
} from '@/lib/connection/types';

const groups: ConnectionGroup[] = [];
const groupMembers: { groupId: string; memberId: string; role: GroupMemberRole }[] = [];
const posts: GroupPost[] = [];
const photos: GroupPhoto[] = [];
const usageRequests: GroupPhotoUsageRequest[] = [];

function gid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getGroupByEventId(eventId: string): ConnectionGroup | null {
  return groups.find((g) => g.eventId === eventId) ?? null;
}

export function ensureGroupForEvent(eventId: string): ConnectionGroup {
  const existing = getGroupByEventId(eventId);
  if (existing) return existing;
  const group: ConnectionGroup = { id: gid('grp'), eventId, createdAt: new Date().toISOString() };
  groups.push(group);
  const event = getEvent(eventId);
  if (event?.hostId) addGroupMember(group.id, event.hostId, 'host');
  return group;
}

export function addGroupMember(groupId: string, memberId: string, role: GroupMemberRole) {
  if (groupMembers.some((m) => m.groupId === groupId && m.memberId === memberId)) return;
  groupMembers.push({ groupId, memberId, role });
}

export function syncGroupForConfirmedMember(eventId: string, memberId: string, role: GroupMemberRole = 'participant') {
  const group = ensureGroupForEvent(eventId);
  addGroupMember(group.id, memberId, role);
}

export function listGroupMembers(groupId: string) {
  return groupMembers.filter((m) => m.groupId === groupId);
}

export function listGroupPosts(groupId: string): GroupPost[] {
  return posts
    .filter((p) => p.groupId === groupId && !p.isHidden)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listGroupPhotos(groupId: string): GroupPhoto[] {
  return photos
    .filter((p) => p.groupId === groupId && !p.isHidden)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createGroupPost(groupId: string, memberId: string, body: string): GroupPost {
  const post: GroupPost = {
    id: gid('gp'),
    groupId,
    memberId,
    body,
    isHidden: false,
    reportCount: 0,
    createdAt: new Date().toISOString(),
  };
  posts.push(post);
  return post;
}

export function createGroupPhotos(
  groupId: string,
  memberId: string,
  urls: string[],
  postId?: string,
): GroupPhoto[] {
  const created: GroupPhoto[] = [];
  for (const url of urls) {
    const photo: GroupPhoto = {
      id: gid('gph'),
      groupId,
      memberId,
      postId,
      url,
      storagePath: '',
      usageStatus: 'private',
      isHidden: false,
      reportCount: 0,
      consentAcknowledged: true,
      createdAt: new Date().toISOString(),
    };
    photos.push(photo);
    created.push(photo);
  }
  return created;
}

export function reportGroupPost(postId: string) {
  const p = posts.find((x) => x.id === postId);
  if (p) p.reportCount += 1;
}

export function reportGroupPhoto(photoId: string) {
  const p = photos.find((x) => x.id === photoId);
  if (p) {
    p.reportCount += 1;
    p.usageStatus = 'reported';
  }
}

export function hideGroupPost(postId: string) {
  const p = posts.find((x) => x.id === postId);
  if (p) p.isHidden = true;
}

export function hideGroupPhoto(photoId: string) {
  const p = photos.find((x) => x.id === photoId);
  if (p) p.isHidden = true;
}

export function requestPhotoUsage(
  photoId: string,
  scopes: GroupPhotoUsageScope[],
  message: string,
): GroupPhotoUsageRequest | null {
  const photo = photos.find((p) => p.id === photoId);
  if (!photo) return null;
  photo.usageStatus = 'requested';
  const req: GroupPhotoUsageRequest = {
    id: gid('gur'),
    photoId,
    scopes,
    message,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  usageRequests.push(req);
  return req;
}

export function mockCanAccessGroup(eventId: string, memberId: string | null, isAdmin: boolean) {
  if (!memberId) return false;
  if (isAdmin) return true;
  const event = getEvent(eventId);
  if (!event) return false;
  if (event.hostId === memberId) return true;
  const app = getApplication(eventId, memberId);
  return app?.status === 'confirmed';
}
