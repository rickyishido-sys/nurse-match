// HANAKAI Connection — data repository (mock | supabase).
//
// Single async surface for all *stateful* accessors. The backend is chosen by
// the HANAKAI_CONNECTION_BACKEND env flag (see src/lib/config.ts), enabling an
// instant rollback (flip the env var, no redeploy logic required).
//
// NOTE: Static constants/labels (PURPOSE_LABEL, EVENT_CATEGORY_META, …) are NOT
// part of this layer — import those directly from '@/lib/connection/data'.
import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import * as mock from '@/lib/connection/data';
import { toPublicMemberView } from '@/lib/connection/member-status';
import * as supa from '@/lib/connection/repo-supabase';
import type {
  ConnectionEvent,
  ConnectionMember,
  EventApplication,
  MemberGroupingProfile,
  PersonalityProfile,
  TrustVerificationStatus,
  VerificationSource,
} from '@/lib/connection/types';
import type { CreateEventInput } from '@/lib/connection/data';

const useSupabase = HANAKAI_CONNECTION_BACKEND === 'supabase';

// --- reads --------------------------------------------------------------

export async function listMembers(): Promise<ConnectionMember[]> {
  return useSupabase ? supa.listMembers() : mock.listMembers();
}

export async function getMember(id: string): Promise<ConnectionMember | null> {
  const member = useSupabase ? await supa.getMember(id) : mock.getMember(id);
  return member ? toPublicMemberView(member) : null;
}

export async function listEvents(): Promise<ConnectionEvent[]> {
  return useSupabase ? supa.listEvents() : mock.listEvents();
}

export async function listUpcomingEvents(limit = 4): Promise<ConnectionEvent[]> {
  return useSupabase ? supa.listUpcomingEvents(limit) : mock.listUpcomingEvents(limit);
}

export async function getEvent(id: string): Promise<ConnectionEvent | null> {
  return useSupabase ? supa.getEvent(id) : mock.getEvent(id);
}

export async function listEventsByHost(hostId: string): Promise<ConnectionEvent[]> {
  return useSupabase ? supa.listEventsByHost(hostId) : mock.listEventsByHost(hostId);
}

export async function listApplications(eventId?: string): Promise<EventApplication[]> {
  return useSupabase ? supa.listApplications(eventId) : mock.listApplications(eventId);
}

export async function listPendingApplications(eventId: string): Promise<EventApplication[]> {
  return useSupabase ? supa.listPendingApplications(eventId) : mock.listPendingApplications(eventId);
}

export async function getApplication(eventId: string, memberId: string): Promise<EventApplication | null> {
  return useSupabase ? supa.getApplication(eventId, memberId) : mock.getApplication(eventId, memberId);
}

export async function listApplicationsForMember(memberId: string): Promise<EventApplication[]> {
  return useSupabase ? supa.listApplicationsForMember(memberId) : mock.listApplications().filter((a) => a.memberId === memberId);
}

export async function getEventMembers(eventId: string): Promise<ConnectionMember[]> {
  const members = useSupabase ? await supa.getEventMembers(eventId) : mock.getEventMembers(eventId);
  return members.map(toPublicMemberView);
}

export async function canViewConnectionPage(eventId: string, viewerMemberId: string): Promise<boolean> {
  return useSupabase
    ? supa.canViewConnectionPage(eventId, viewerMemberId)
    : mock.canViewConnectionPage(eventId, viewerMemberId);
}

// --- writes -------------------------------------------------------------

export async function applyToEvent(eventId: string, memberId: string, reason?: string): Promise<void> {
  if (useSupabase) return supa.applyToEvent(eventId, memberId, reason);
  mock.applyToEvent(eventId, memberId, reason);
}

export async function rejectApplication(eventId: string, memberId: string): Promise<void> {
  if (useSupabase) return supa.rejectApplication(eventId, memberId);
  mock.rejectApplication(eventId, memberId);
}

export async function createEvent(input: CreateEventInput): Promise<ConnectionEvent> {
  const event = useSupabase ? await supa.createEvent(input) : mock.createEvent(input);
  const { syncGroupHost } = await import('@/lib/connection/group-repo');
  await syncGroupHost(event.id, input.hostId);
  return event;
}

export async function confirmMemberForEvent(eventId: string, memberId: string): Promise<void> {
  if (useSupabase) await supa.confirmMemberForEvent(eventId, memberId);
  else mock.confirmMemberForEvent(eventId, memberId);
  const { syncGroupForConfirmedMember } = await import('@/lib/connection/group-repo');
  await syncGroupForConfirmedMember(eventId, memberId, 'participant');
}

export async function removeMemberFromEvent(eventId: string, memberId: string): Promise<void> {
  if (useSupabase) return supa.removeMemberFromEvent(eventId, memberId);
  mock.removeMemberFromEvent(eventId, memberId);
}

export async function updateMember(
  id: string,
  patch: Partial<Omit<ConnectionMember, 'id'>>,
): Promise<ConnectionMember | null> {
  return useSupabase ? supa.updateMember(id, patch) : mock.updateMember(id, patch);
}

export async function saveMemberPersonality(id: string, personality: PersonalityProfile) {
  return useSupabase ? supa.saveMemberPersonality(id, personality) : mock.saveMemberPersonality(id, personality);
}

export async function saveMemberSocialLinks(
  memberId: string,
  links: {
    platform: import('@/lib/connection/bloom-profile-options').SocialLinkPlatform;
    url: string;
    isVisibleOnProfile?: boolean;
  }[],
) {
  if (useSupabase) return supa.saveMemberSocialLinks(memberId, links);
}

export async function saveMemberPhotos(
  memberId: string,
  manifest: supa.PhotoManifestEntry[],
  newFiles: File[],
) {
  return useSupabase ? supa.saveMemberPhotos(memberId, manifest, newFiles) : mock.saveMemberPhotos(memberId, manifest, newFiles);
}

export async function updateMemberTrust(
  id: string,
  patch: {
    trustVerificationStatus?: TrustVerificationStatus;
    trustNotes?: string | null;
    safetyFlags?: string[];
    verificationSource?: VerificationSource;
    identityVerified?: boolean;
  },
) {
  return useSupabase ? supa.updateMemberTrust(id, patch) : mock.updateMemberTrust(id, patch);
}

export async function getGroupingProfile(memberId: string): Promise<MemberGroupingProfile | null> {
  return useSupabase ? supa.getGroupingProfile(memberId) : mock.getGroupingProfile(memberId);
}
