// HANAKAI Connection — Supabase-backed repository (hanakai_* tables).
// Mirrors the async surface declared in repo.ts. Reads are public (RLS select
// true); writes run server-side via the service-role client. Identity is
// resolved separately (see identity.ts) and passed in as member ids.
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  ConnectionEvent,
  ConnectionMember,
  EventApplication,
  MemberGroupingProfile,
  PersonalityProfile,
  ProfileValues,
  TrustVerificationStatus,
  VerificationSource,
} from '@/lib/connection/types';
import type { CreateEventInput } from '@/lib/connection/data';

// --- low-level clients --------------------------------------------------

/**
 * 読み書き両用のサーバー側クライアント。
 * HANAKAI の全導線は RLS + (匿名)セッションで成立するため server client を使う。
 * 共有の service_role キーには依存しない（Nurse Match の導線・共有設定へ影響を与えない）。
 */
async function db() {
  return createServerSupabaseClient();
}

type MemberRow = Record<string, any>;
type EventRow = Record<string, any>;
type AppRow = Record<string, any>;

// --- mappers ------------------------------------------------------------

const EMPTY_VALUES: ProfileValues = {
  mostImportant: '',
  currentChallenge: '',
  futureGoal: '',
  recentInspiration: '',
  howOthersSeeMe: '',
  personalityOneWord: '',
  coreValues: '',
  valueTags: [],
};

function memberFromRow(row: MemberRow): ConnectionMember {
  return {
    id: row.id,
    nickname: row.nickname ?? '',
    age: row.age ?? 0,
    gender: (row.gender ?? 'other') as ConnectionMember['gender'],
    area: row.area ?? '',
    occupation: row.occupation ?? '',
    bio: row.bio ?? '',
    avatarUrl: row.avatar_url ?? '',
    values: { ...EMPTY_VALUES, ...((row.values ?? {}) as Partial<ProfileValues>) },
    purposes: row.purposes ?? [],
    interestTags: row.interest_tags ?? [],
    lifePhase: row.life_phase ?? 'other',
    personality: (row.personality ?? null) as PersonalityProfile | null,
    hostBadges: row.host_badges ?? [],
    trustVerificationStatus: row.trust_verification_status ?? 'pending',
    identityVerified: row.identity_verified ?? false,
    identityVerificationDate: row.identity_verification_date ?? null,
    trustVerificationDate: row.trust_verification_date ?? null,
    trustNotes: row.trust_notes ?? null,
    safetyFlags: row.safety_flags ?? [],
    verificationSource: (row.verification_source ?? 'none') as VerificationSource,
    identityVerificationMethod: row.identity_verification_method ?? 'none',
    externalVerificationRef: row.external_verification_ref ?? null,
    documentUploadStatus: row.document_upload_status ?? 'none',
  };
}

function appFromRow(row: AppRow): EventApplication {
  return {
    id: row.id,
    eventId: row.event_id,
    memberId: row.member_id,
    appliedAt: row.applied_at,
    status: row.status,
    reason: row.reason ?? undefined,
  };
}

function eventFromRow(row: EventRow, apps: AppRow[]): ConnectionEvent {
  const active = apps.filter((a) => a.status !== 'rejected');
  const confirmed = apps.filter((a) => a.status === 'confirmed').map((a) => a.member_id as string);
  const isPast = row.is_past === true || new Date(row.start_at).getTime() < Date.now();
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    startAt: row.start_at,
    area: row.area ?? '',
    venue: row.venue ?? '',
    capacity: row.capacity ?? 0,
    reservedCount: active.length,
    hostName: row.host_name ?? 'HANAKAI Connection 運営',
    conditions: row.conditions ?? '',
    description: row.description ?? '',
    coverUrl: row.cover_url ?? '',
    status: row.status,
    isPast,
    confirmedMemberIds: confirmed,
    fee: row.fee ?? 0,
    approvalMode: row.approval_mode ?? 'host_approval',
    hostId: row.host_member_id ?? undefined,
    isUserCreated: row.is_user_created ?? false,
  };
}

async function appsByEvent(eventIds: string[]): Promise<Map<string, AppRow[]>> {
  const map = new Map<string, AppRow[]>();
  if (eventIds.length === 0) return map;
  const sb = await db();
  if (!sb) return map;
  const { data } = await sb
    .from('hanakai_event_applications')
    .select('*')
    .in('event_id', eventIds);
  for (const row of data ?? []) {
    const list = map.get(row.event_id) ?? [];
    list.push(row);
    map.set(row.event_id, list);
  }
  return map;
}

// --- reads --------------------------------------------------------------

export async function listMembers(): Promise<ConnectionMember[]> {
  const sb = await db();
  if (!sb) return [];
  const { data } = await sb.from('hanakai_members').select('*');
  return (data ?? []).map(memberFromRow);
}

export async function getMember(id: string): Promise<ConnectionMember | null> {
  const sb = await db();
  if (!sb) return null;
  const { data } = await sb.from('hanakai_members').select('*').eq('id', id).maybeSingle();
  return data ? memberFromRow(data) : null;
}

export async function listEvents(): Promise<ConnectionEvent[]> {
  const sb = await db();
  if (!sb) return [];
  const { data } = await sb.from('hanakai_events').select('*').order('start_at', { ascending: true });
  const rows = data ?? [];
  const apps = await appsByEvent(rows.map((r) => r.id));
  return rows.map((r) => eventFromRow(r, apps.get(r.id) ?? []));
}

export async function listUpcomingEvents(limit = 4): Promise<ConnectionEvent[]> {
  return (await listEvents()).filter((e) => !e.isPast).slice(0, limit);
}

export async function getEvent(id: string): Promise<ConnectionEvent | null> {
  const sb = await db();
  if (!sb) return null;
  const { data } = await sb.from('hanakai_events').select('*').eq('id', id).maybeSingle();
  if (!data) return null;
  const apps = await appsByEvent([id]);
  return eventFromRow(data, apps.get(id) ?? []);
}

export async function listEventsByHost(hostId: string): Promise<ConnectionEvent[]> {
  return (await listEvents()).filter((e) => e.hostId === hostId);
}

export async function listApplications(eventId?: string): Promise<EventApplication[]> {
  const sb = await db();
  if (!sb) return [];
  let q = sb.from('hanakai_event_applications').select('*').order('applied_at', { ascending: true });
  if (eventId) q = q.eq('event_id', eventId);
  const { data } = await q;
  return (data ?? []).map(appFromRow);
}

export async function listPendingApplications(eventId: string): Promise<EventApplication[]> {
  return (await listApplications(eventId)).filter((a) => a.status === 'pending');
}

export async function getApplication(eventId: string, memberId: string): Promise<EventApplication | null> {
  const sb = await db();
  if (!sb) return null;
  const { data } = await sb
    .from('hanakai_event_applications')
    .select('*')
    .eq('event_id', eventId)
    .eq('member_id', memberId)
    .maybeSingle();
  return data ? appFromRow(data) : null;
}

export async function getEventMembers(eventId: string): Promise<ConnectionMember[]> {
  const sb = await db();
  if (!sb) return [];
  const { data: apps } = await sb
    .from('hanakai_event_applications')
    .select('member_id')
    .eq('event_id', eventId)
    .eq('status', 'confirmed');
  const ids = (apps ?? []).map((a) => a.member_id);
  if (ids.length === 0) return [];
  const { data: rows } = await sb.from('hanakai_members').select('*').in('id', ids);
  return (rows ?? []).map(memberFromRow);
}

export async function canViewConnectionPage(eventId: string, viewerMemberId: string): Promise<boolean> {
  const event = await getEvent(eventId);
  if (!event?.isPast) return false;
  return event.confirmedMemberIds.includes(viewerMemberId);
}

// --- writes -------------------------------------------------------------

export async function applyToEvent(eventId: string, memberId: string, reason?: string): Promise<void> {
  const sb = await db();
  if (!sb) return;
  const existing = await getApplication(eventId, memberId);
  if (existing) return;
  const event = await getEvent(eventId);
  const autoApprove = event?.approvalMode === 'auto';
  await sb.from('hanakai_event_applications').insert({
    event_id: eventId,
    member_id: memberId,
    status: autoApprove ? 'confirmed' : 'pending',
    reason: reason?.trim() ? reason.trim() : null,
    decided_at: autoApprove ? new Date().toISOString() : null,
  });
}

export async function rejectApplication(eventId: string, memberId: string): Promise<void> {
  const sb = await db();
  if (!sb) return;
  await sb
    .from('hanakai_event_applications')
    .update({ status: 'rejected', decided_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('member_id', memberId);
}

export async function createEvent(input: CreateEventInput): Promise<ConnectionEvent> {
  const sb = await db();
  const host = await getMember(input.hostId);
  const payload = {
    title: input.title,
    category: input.category,
    start_at: input.startAt,
    area: input.area,
    venue: input.venue,
    capacity: input.capacity,
    host_member_id: input.hostId,
    host_name: host?.nickname || 'HANAKAI ホスト',
    conditions: input.conditions,
    description: input.description,
    cover_url: input.coverUrl,
    status: 'open',
    fee: input.fee,
    approval_mode: input.approvalMode,
    is_user_created: true,
    is_past: false,
  };
  if (!sb) {
    // クライアント不在時もフォーム遷移を壊さない最低限のフォールバック
    return eventFromRow({ id: `ue_${Date.now()}`, ...payload }, []);
  }
  const { data } = await sb.from('hanakai_events').insert(payload).select('*').single();
  return eventFromRow(data ?? { id: `ue_${Date.now()}`, ...payload }, []);
}

export async function confirmMemberForEvent(eventId: string, memberId: string): Promise<void> {
  const sb = await db();
  if (!sb) return;
  const existing = await getApplication(eventId, memberId);
  if (existing) {
    await sb
      .from('hanakai_event_applications')
      .update({ status: 'confirmed', decided_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .eq('member_id', memberId);
  } else {
    await sb.from('hanakai_event_applications').insert({
      event_id: eventId,
      member_id: memberId,
      status: 'confirmed',
      decided_at: new Date().toISOString(),
    });
  }
}

export async function removeMemberFromEvent(eventId: string, memberId: string): Promise<void> {
  const sb = await db();
  if (!sb) return;
  await sb
    .from('hanakai_event_applications')
    .update({ status: 'pending', decided_at: null })
    .eq('event_id', eventId)
    .eq('member_id', memberId);
}

type MemberPatch = Partial<Omit<ConnectionMember, 'id'>>;

function toMemberUpdate(patch: MemberPatch): Record<string, any> {
  const out: Record<string, any> = {};
  if (patch.nickname !== undefined) out.nickname = patch.nickname;
  if (patch.age !== undefined) out.age = patch.age;
  if (patch.gender !== undefined) out.gender = patch.gender;
  if (patch.area !== undefined) out.area = patch.area;
  if (patch.occupation !== undefined) out.occupation = patch.occupation;
  if (patch.bio !== undefined) out.bio = patch.bio;
  if (patch.avatarUrl !== undefined) out.avatar_url = patch.avatarUrl;
  if (patch.values !== undefined) out.values = patch.values;
  if (patch.purposes !== undefined) out.purposes = patch.purposes;
  if (patch.interestTags !== undefined) out.interest_tags = patch.interestTags;
  if (patch.lifePhase !== undefined) out.life_phase = patch.lifePhase;
  if (patch.personality !== undefined) out.personality = patch.personality;
  if (patch.hostBadges !== undefined) out.host_badges = patch.hostBadges;
  if (patch.trustVerificationStatus !== undefined) out.trust_verification_status = patch.trustVerificationStatus;
  if (patch.identityVerified !== undefined) out.identity_verified = patch.identityVerified;
  if (patch.identityVerificationDate !== undefined) out.identity_verification_date = patch.identityVerificationDate;
  if (patch.trustVerificationDate !== undefined) out.trust_verification_date = patch.trustVerificationDate;
  if (patch.trustNotes !== undefined) out.trust_notes = patch.trustNotes;
  if (patch.safetyFlags !== undefined) out.safety_flags = patch.safetyFlags;
  if (patch.verificationSource !== undefined) out.verification_source = patch.verificationSource;
  if (patch.identityVerificationMethod !== undefined) out.identity_verification_method = patch.identityVerificationMethod;
  if (patch.externalVerificationRef !== undefined) out.external_verification_ref = patch.externalVerificationRef;
  if (patch.documentUploadStatus !== undefined) out.document_upload_status = patch.documentUploadStatus;
  return out;
}

export async function updateMember(id: string, patch: MemberPatch): Promise<ConnectionMember | null> {
  const sb = await db();
  if (!sb) return null;
  const update = toMemberUpdate(patch);
  if (Object.keys(update).length === 0) return getMember(id);
  const { data } = await sb.from('hanakai_members').update(update).eq('id', id).select('*').maybeSingle();
  return data ? memberFromRow(data) : null;
}

export async function saveMemberPersonality(id: string, personality: PersonalityProfile) {
  return updateMember(id, { personality });
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
  const member = await getMember(id);
  if (!member) return null;
  const now = new Date().toISOString();
  const status = patch.trustVerificationStatus ?? member.trustVerificationStatus;
  return updateMember(id, {
    trustVerificationStatus: status,
    trustNotes: patch.trustNotes !== undefined ? patch.trustNotes : member.trustNotes,
    safetyFlags: patch.safetyFlags ?? member.safetyFlags,
    verificationSource: patch.verificationSource ?? member.verificationSource,
    identityVerified: patch.identityVerified ?? member.identityVerified,
    trustVerificationDate:
      status === 'verified' && member.trustVerificationStatus !== 'verified' ? now : member.trustVerificationDate,
    identityVerificationDate:
      patch.identityVerified && !member.identityVerified ? now : member.identityVerificationDate,
  });
}

export async function getGroupingProfile(memberId: string): Promise<MemberGroupingProfile | null> {
  const m = await getMember(memberId);
  if (!m) return null;
  return {
    memberId: m.id,
    demographics: { age: m.age, gender: m.gender, occupation: m.occupation, lifePhase: m.lifePhase },
    values: m.values,
    purposes: m.purposes,
    interestTags: m.interestTags,
    personality: m.personality,
    trust: {
      trustVerificationStatus: m.trustVerificationStatus,
      identityVerified: m.identityVerified,
      verificationSource: m.verificationSource,
      safetyFlags: m.safetyFlags,
    },
  };
}
