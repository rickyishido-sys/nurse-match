// HANAKAI Connection — Supabase-backed repository (hanakai_* tables).
// Mirrors the async surface declared in repo.ts. Reads are public (RLS select
// true); writes run server-side via the service-role client. Identity is
// resolved separately (see identity.ts) and passed in as member ids.
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { inferAgeBandFromAge } from '@/lib/connection/bloom-profile-options';
import type { SocialLinkPlatform } from '@/lib/connection/bloom-profile-options';
import type { CreateEventInput } from '@/lib/connection/data';
import { deleteProfilePhotoFile, uploadProfilePhoto } from '@/lib/connection/profile-photo-storage';
import type {
  ConnectionEvent,
  ConnectionMember,
  EventApplication,
  MemberGroupingProfile,
  MemberProfilePhoto,
  MemberSocialLink,
  PersonalityProfile,
  ProfilePhotoCategory,
  ProfileValues,
  TrustVerificationStatus,
  VerificationSource,
} from '@/lib/connection/types';

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

function photoFromRow(row: Record<string, unknown>): MemberProfilePhoto {
  return {
    id: String(row.id),
    memberId: String(row.member_id),
    url: String(row.url ?? ''),
    storagePath: String(row.storage_path ?? ''),
    sortOrder: Number(row.sort_order ?? 0),
    category: (row.category as ProfilePhotoCategory) ?? null,
  };
}

async function photosForMembers(memberIds: string[]): Promise<Map<string, MemberProfilePhoto[]>> {
  const map = new Map<string, MemberProfilePhoto[]>();
  if (memberIds.length === 0) return map;
  const sb = await db();
  if (!sb) return map;
  const { data, error } = await sb
    .from('hanakai_member_photos')
    .select('*')
    .in('member_id', memberIds)
    .order('sort_order', { ascending: true });
  if (error) {
    console.warn('HANAKAI_PHOTOS_FETCH_FAILED', { message: error.message, code: error.code });
    return map;
  }
  for (const row of data ?? []) {
    const photo = photoFromRow(row);
    const list = map.get(photo.memberId) ?? [];
    list.push(photo);
    map.set(photo.memberId, list);
  }
  return map;
}

function socialLinkFromRow(row: Record<string, unknown>): MemberSocialLink {
  return {
    id: String(row.id),
    memberId: String(row.member_id),
    platform: row.platform as SocialLinkPlatform,
    url: String(row.url ?? ''),
    isVisibleOnProfile: Boolean(row.is_visible_on_profile),
  };
}

async function socialLinksForMembers(memberIds: string[]): Promise<Map<string, MemberSocialLink[]>> {
  const map = new Map<string, MemberSocialLink[]>();
  if (memberIds.length === 0) return map;
  const sb = await db();
  if (!sb) return map;
  const { data, error } = await sb.from('hanakai_member_social_links').select('*').in('member_id', memberIds);
  if (error) {
    console.warn('HANAKAI_SOCIAL_LINKS_FETCH_FAILED', { message: error.message, code: error.code });
    return map;
  }
  for (const row of data ?? []) {
    const link = socialLinkFromRow(row);
    const list = map.get(link.memberId) ?? [];
    list.push(link);
    map.set(link.memberId, list);
  }
  return map;
}

function memberFromRow(
  row: MemberRow,
  photos: MemberProfilePhoto[] = [],
  socialLinks: MemberSocialLink[] = [],
): ConnectionMember {
  const sorted = [...photos].sort((a, b) => a.sortOrder - b.sortOrder);
  const mainUrl = sorted[0]?.url || (row.avatar_url ?? '');
  const age = row.age ?? 0;
  const ageBand = (row.age_band as ConnectionMember['ageBand']) || inferAgeBandFromAge(age) || '';
  return {
    id: row.id,
    nickname: row.nickname ?? '',
    age,
    ageBand,
    gender: (row.gender ?? 'other') as ConnectionMember['gender'],
    area: row.area ?? '',
    occupation: row.occupation ?? '',
    bio: row.bio ?? '',
    avatarUrl: mainUrl,
    photos: sorted,
    values: { ...EMPTY_VALUES, ...((row.values ?? {}) as Partial<ProfileValues>) },
    purposes: row.purposes ?? [],
    interestTags: row.interest_tags ?? [],
    lifePhase: row.life_phase ?? 'other',
    personality: (row.personality ?? null) as PersonalityProfile | null,
    mbtiType: (row.mbti_type as ConnectionMember['mbtiType']) ?? '',
    socialLinks,
    introductionAiGenerated: Boolean(row.introduction_ai_generated),
    introductionGeneratedAt: row.introduction_generated_at ?? null,
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
    status: (row.status === 'deleted' ? 'deleted' : 'active') as ConnectionMember['status'],
    deletedAt: row.deleted_at ?? null,
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
    confirmationToken: row.confirmation_token ?? undefined,
    confirmedAt: row.confirmed_at ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
    cancelReason: row.cancel_reason ?? undefined,
  };
}

function activeApplicationStatuses(): string[] {
  return ['pending', 'awaiting_confirmation', 'confirmed'];
}

function eventFromRow(row: EventRow, apps: AppRow[]): ConnectionEvent {
  const active = apps.filter((a) => activeApplicationStatuses().includes(a.status));
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
    imageUrls: row.image_urls ?? [],
    status: row.status,
    isPast,
    confirmedMemberIds: confirmed,
    fee: row.fee ?? 0,
    approvalMode: row.approval_mode ?? 'host_approval',
    hostId: row.host_member_id ?? undefined,
    isUserCreated: row.is_user_created ?? false,
    recruitmentType: row.recruitment_type ?? 'standard',
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
  const rows = data ?? [];
  const ids = rows.map((r) => r.id as string);
  const [photoMap, socialMap] = await Promise.all([photosForMembers(ids), socialLinksForMembers(ids)]);
  return rows.map((r) =>
    memberFromRow(r, photoMap.get(r.id as string) ?? [], socialMap.get(r.id as string) ?? []),
  );
}

export async function getMember(id: string): Promise<ConnectionMember | null> {
  const sb = await db();
  if (!sb) return null;
  const { data } = await sb.from('hanakai_members').select('*').eq('id', id).maybeSingle();
  if (!data) return null;
  const [photoMap, socialMap] = await Promise.all([photosForMembers([id]), socialLinksForMembers([id])]);
  return memberFromRow(data, photoMap.get(id) ?? [], socialMap.get(id) ?? []);
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

export async function listApplicationsForMember(memberId: string): Promise<EventApplication[]> {
  const sb = await db();
  if (!sb) return [];
  const { data } = await sb
    .from('hanakai_event_applications')
    .select('*')
    .eq('member_id', memberId)
    .order('applied_at', { ascending: false });
  return (data ?? []).map(appFromRow);
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
  const photoMap = await photosForMembers(ids);
  return (rows ?? []).map((r) => memberFromRow(r, photoMap.get(r.id as string) ?? []));
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
  const { buildEventOperationsPayload } = await import('@/lib/connection/event-operations/repo');
  const ops = input.operations ? buildEventOperationsPayload(input.operations) : null;
  const payload: Record<string, unknown> = {
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
    ...(ops?.payload ?? {}),
  };
  // image_urls カラム未適用環境でも作成を壊さないよう、写真がある時のみ含める。
  if (input.imageUrls && input.imageUrls.length > 0) {
    payload.image_urls = input.imageUrls;
  }
  if (!sb) {
    return eventFromRow({ id: `ue_${Date.now()}`, ...payload }, []);
  }
  const { data, error } = await sb.from('hanakai_events').insert(payload).select('*').single();
  if (error) {
    console.error('HANAKAI_EVENT_INSERT_FAILED', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw error;
  }
  return eventFromRow(data, []);
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
  if (patch.ageBand !== undefined) out.age_band = patch.ageBand || null;
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
  if (patch.mbtiType !== undefined) out.mbti_type = patch.mbtiType || null;
  if (patch.introductionAiGenerated !== undefined) out.introduction_ai_generated = patch.introductionAiGenerated;
  if (patch.introductionGeneratedAt !== undefined) out.introduction_generated_at = patch.introductionGeneratedAt;
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.deletedAt !== undefined) out.deleted_at = patch.deletedAt;
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
  if (!data) return null;
  const [photoMap, socialMap] = await Promise.all([photosForMembers([id]), socialLinksForMembers([id])]);
  return memberFromRow(data, photoMap.get(id) ?? [], socialMap.get(id) ?? []);
}

function isMissingVisibilityColumnError(message: string | undefined): boolean {
  if (!message) return false;
  return (
    message.includes('is_visible_on_profile') ||
    message.includes('PGRST204')
  );
}

async function upsertSocialLinkRow(
  sb: NonNullable<Awaited<ReturnType<typeof db>>>,
  memberId: string,
  link: { platform: SocialLinkPlatform; url: string; isVisibleOnProfile: boolean },
): Promise<void> {
  const now = new Date().toISOString();
  const base = {
    member_id: memberId,
    platform: link.platform,
    url: link.url,
    updated_at: now,
  };

  const withVisibility = {
    ...base,
    is_visible_on_profile: link.isVisibleOnProfile,
  };

  let result = await sb
    .from('hanakai_member_social_links')
    .upsert(withVisibility, { onConflict: 'member_id,platform' });

  if (result.error && isMissingVisibilityColumnError(result.error.message)) {
    result = await sb
      .from('hanakai_member_social_links')
      .upsert(base, { onConflict: 'member_id,platform' });
  }

  if (result.error) {
    console.error('HANAKAI_SOCIAL_LINK_UPSERT_FAILED', {
      memberId,
      platform: link.platform,
      url: link.url,
      isVisibleOnProfile: link.isVisibleOnProfile,
      message: result.error.message,
      code: result.error.code,
    });
    throw new Error(`SNSリンクの保存に失敗しました (${link.platform})`);
  }
}

export async function saveMemberSocialLinks(
  memberId: string,
  links: { platform: SocialLinkPlatform; url: string; isVisibleOnProfile?: boolean }[],
): Promise<void> {
  const sb = await db();
  if (!sb) throw new Error('Supabase client unavailable');

  const trimmed = links
    .map((l) => ({
      platform: l.platform,
      url: l.url.trim(),
      isVisibleOnProfile: Boolean(l.isVisibleOnProfile),
    }))
    .filter((l) => l.url.length > 0);

  const { data: existing, error: existingError } = await sb
    .from('hanakai_member_social_links')
    .select('platform')
    .eq('member_id', memberId);

  if (existingError) {
    console.error('HANAKAI_SOCIAL_LINK_READ_FAILED', {
      memberId,
      message: existingError.message,
      code: existingError.code,
    });
    throw new Error('SNSリンクの読み込みに失敗しました');
  }

  const keepPlatforms = new Set(trimmed.map((l) => l.platform));
  const toDelete = (existing ?? [])
    .map((r) => String(r.platform))
    .filter((p) => !keepPlatforms.has(p as SocialLinkPlatform));

  // 先に upsert してから削除（upsert 失敗時に既存データを消さない）
  for (const link of trimmed) {
    await upsertSocialLinkRow(sb, memberId, link);
  }

  for (const platform of toDelete) {
    const { error } = await sb
      .from('hanakai_member_social_links')
      .delete()
      .eq('member_id', memberId)
      .eq('platform', platform);
    if (error) {
      console.error('HANAKAI_SOCIAL_LINK_DELETE_FAILED', {
        memberId,
        platform,
        message: error.message,
        code: error.code,
      });
      throw new Error(`SNSリンクの削除に失敗しました (${platform})`);
    }
  }
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
    documentUploadStatus?: ConnectionMember['documentUploadStatus'];
  },
) {
  const member = await getMember(id);
  if (!member) return null;
  const now = new Date().toISOString();
  const status = patch.trustVerificationStatus ?? member.trustVerificationStatus;
  const identityVerified = patch.identityVerified ?? member.identityVerified;
  let documentUploadStatus = patch.documentUploadStatus ?? member.documentUploadStatus;
  if (patch.identityVerified === true) {
    documentUploadStatus = 'approved';
  } else if (patch.identityVerified === false && documentUploadStatus === 'approved') {
    documentUploadStatus = 'none';
  }
  return updateMember(id, {
    trustVerificationStatus: status,
    trustNotes: patch.trustNotes !== undefined ? patch.trustNotes : member.trustNotes,
    safetyFlags: patch.safetyFlags ?? member.safetyFlags,
    verificationSource: patch.verificationSource ?? member.verificationSource,
    identityVerified,
    documentUploadStatus,
    trustVerificationDate:
      status === 'verified' && member.trustVerificationStatus !== 'verified' ? now : member.trustVerificationDate,
    identityVerificationDate:
      identityVerified && !member.identityVerified ? now : member.identityVerificationDate,
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

export type PhotoManifestEntry = { type: 'existing'; id: string } | { type: 'new'; fileIndex: number };

const MAX_PROFILE_PHOTOS = 6;

/** プロフィール写真を並び替え・追加・削除して保存。1枚目を avatar_url に同期。 */
export async function saveMemberPhotos(
  memberId: string,
  manifest: PhotoManifestEntry[],
  newFiles: File[],
): Promise<MemberProfilePhoto[]> {
  const sb = await db();
  if (!sb) return [];

  const trimmed = manifest.slice(0, MAX_PROFILE_PHOTOS);
  const current = (await photosForMembers([memberId])).get(memberId) ?? [];
  const currentById = new Map(current.map((p) => [p.id, p]));

  const finalRows: { id?: string; url: string; storagePath: string; category: ProfilePhotoCategory }[] = [];

  for (const entry of trimmed) {
    if (entry.type === 'existing') {
      const photo = currentById.get(entry.id);
      if (photo) {
        finalRows.push({
          id: photo.id,
          url: photo.url,
          storagePath: photo.storagePath,
          category: photo.category,
        });
      }
    } else if (entry.type === 'new') {
      const file = newFiles[entry.fileIndex];
      if (!file) continue;
      const uploaded = await uploadProfilePhoto(memberId, file);
      if (uploaded) {
        finalRows.push({
          url: uploaded.url,
          storagePath: uploaded.storagePath,
          category: null,
        });
      }
    }
  }

  const keepIds = new Set(finalRows.map((r) => r.id).filter(Boolean));
  for (const photo of current) {
    if (!keepIds.has(photo.id)) {
      await deleteProfilePhotoFile(photo.storagePath);
      await sb.from('hanakai_member_photos').delete().eq('id', photo.id);
    }
  }

  const saved: MemberProfilePhoto[] = [];
  for (let i = 0; i < finalRows.length; i++) {
    const row = finalRows[i];
    if (row.id) {
      const { data } = await sb
        .from('hanakai_member_photos')
        .update({ sort_order: i, category: row.category })
        .eq('id', row.id)
        .select('*')
        .maybeSingle();
      if (data) saved.push(photoFromRow(data));
    } else {
      const { data } = await sb
        .from('hanakai_member_photos')
        .insert({
          member_id: memberId,
          storage_path: row.storagePath,
          url: row.url,
          sort_order: i,
          category: row.category,
        })
        .select('*')
        .single();
      if (data) saved.push(photoFromRow(data));
    }
  }

  const mainUrl = saved[0]?.url ?? '';
  await sb.from('hanakai_members').update({ avatar_url: mainUrl }).eq('id', memberId);

  return saved.sort((a, b) => a.sortOrder - b.sortOrder);
}
