import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import { EVENT_CATEGORY_LABEL, INTEREST_TAG_LABEL, LIFE_PHASE_LABEL, PURPOSE_LABEL, VALUE_TAG_LABEL } from '@/lib/connection/data';
import {
  listApplications as repoListApplications,
  listEvents as repoListEvents,
  listMembers as repoListMembers,
  getMember as repoGetMember,
  confirmMemberForEvent,
  rejectApplication,
} from '@/lib/connection/repo';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PERSONALITY_TYPE_META } from '@/lib/connection/personality';
import { MBTI_LABEL, SOCIAL_PLATFORM_LABEL } from '@/lib/connection/bloom-profile-options';
import type {
  AdminApplicationRow,
  AdminEventRow,
  AdminMemberDetail,
  AdminMemberRow,
  AdminMemberStatus,
  AdminReportRow,
  AdminReportStatus,
  HanakaiAdminDashboard,
} from '@/lib/connection/hanakai-admin-types';
import type { ConnectionEventCategory, ConnectionMember, InterestTag, LifePhase, ValueTag } from '@/lib/connection/types';

const useSupabase = HANAKAI_CONNECTION_BACKEND === 'supabase';

const GENDER_LABEL: Record<string, string> = {
  female: '女性',
  male: '男性',
  other: 'その他',
};

function memberStatus(): AdminMemberStatus {
  return 'active';
}

function visibilityLabel(status: string, isPast: boolean): string {
  if (isPast) return '終了';
  if (status === 'closed' || status === 'completed') return '非公開';
  return '公開中';
}

function memberToRow(member: ConnectionMember, createdAt = '', updatedAt = ''): AdminMemberRow {
  return {
    id: member.id,
    nickname: member.nickname || '（未設定）',
    age: member.age,
    gender: member.gender,
    genderLabel: GENDER_LABEL[member.gender] ?? member.gender,
    area: member.area || '—',
    lifePhase: member.lifePhase,
    lifePhaseLabel: LIFE_PHASE_LABEL[member.lifePhase as LifePhase] ?? member.lifePhase,
    avatarUrl: member.avatarUrl,
    createdAt,
    updatedAt,
    status: memberStatus(),
  };
}

function eventToRow(event: Awaited<ReturnType<typeof repoListEvents>>[number]): AdminEventRow {
  const apps = event.confirmedMemberIds.length;
  return {
    id: event.id,
    title: event.title,
    category: event.category,
    categoryLabel: EVENT_CATEGORY_LABEL[event.category as ConnectionEventCategory] ?? event.category,
    hostName: event.hostName,
    startAt: event.startAt,
    area: event.area,
    venue: event.venue,
    capacity: event.capacity,
    applicationCount: event.reservedCount,
    confirmedCount: apps,
    status: event.status,
    isPast: event.isPast,
    visibilityLabel: visibilityLabel(event.status, event.isPast),
  };
}

async function safeTableCount(table: string, filter?: { column: string; value: string }): Promise<number | 'unlinked'> {
  if (!useSupabase) return 0;
  try {
    const sb = await createServerSupabaseClient();
    if (!sb) return 0;
    let q = sb.from(table).select('*', { count: 'exact', head: true });
    if (filter) q = q.eq(filter.column, filter.value);
    const { count, error } = await q;
    if (error) {
      console.warn('HANAKAI_ADMIN_COUNT_SKIP', { table, message: error.message });
      return 'unlinked';
    }
    return count ?? 0;
  } catch (e) {
    console.warn('HANAKAI_ADMIN_COUNT_FAILED', { table, error: String(e) });
    return 'unlinked';
  }
}

async function loadMemberTimestamps(): Promise<Map<string, { createdAt: string; updatedAt: string }>> {
  const map = new Map<string, { createdAt: string; updatedAt: string }>();
  if (!useSupabase) return map;
  try {
    const sb = await createServerSupabaseClient();
    if (!sb) return map;
    const { data, error } = await sb.from('hanakai_members').select('id, created_at, updated_at');
    if (error || !data) return map;
    for (const row of data) {
      map.set(String(row.id), {
        createdAt: String(row.created_at ?? ''),
        updatedAt: String(row.updated_at ?? ''),
      });
    }
  } catch {
    /* ignore */
  }
  return map;
}

type RawApplication = {
  id: string;
  eventId: string;
  memberId: string;
  appliedAt: string;
  status: 'pending' | 'confirmed' | 'rejected';
  reason?: string;
  decidedAt: string | null;
  decisionNote?: string | null;
};

async function adminDb() {
  if (!useSupabase) return null;
  return createAdminSupabaseClient();
}

async function loadApplicationsRaw(): Promise<RawApplication[]> {
  if (!useSupabase) {
    return (await repoListApplications()).map((a) => ({
      id: a.id,
      eventId: a.eventId,
      memberId: a.memberId,
      appliedAt: a.appliedAt,
      status: a.status,
      reason: a.reason,
      decidedAt: null,
    }));
  }
  try {
    const sb = await createServerSupabaseClient();
    if (!sb) return [];
    const { data, error } = await sb
      .from('hanakai_event_applications')
      .select('id, event_id, member_id, applied_at, status, reason, decided_at, decision_note')
      .order('applied_at', { ascending: false });
    if (error || !data) return [];
    return data.map((row) => ({
      id: String(row.id),
      eventId: String(row.event_id),
      memberId: String(row.member_id),
      appliedAt: String(row.applied_at),
      status: row.status as RawApplication['status'],
      reason: row.reason ?? undefined,
      decidedAt: row.decided_at ? String(row.decided_at) : null,
      decisionNote: row.decision_note ? String(row.decision_note) : null,
    }));
  } catch {
    return (await repoListApplications()).map((a) => ({
      id: a.id,
      eventId: a.eventId,
      memberId: a.memberId,
      appliedAt: a.appliedAt,
      status: a.status,
      reason: a.reason,
      decidedAt: null,
    }));
  }
}

function applicationToRow(
  app: RawApplication,
  eventTitle: string,
  memberNickname: string,
): AdminApplicationRow {
  return {
    id: app.id,
    eventId: app.eventId,
    eventTitle,
    memberId: app.memberId,
    memberNickname,
    reason: app.reason,
    appliedAt: app.appliedAt,
    status: app.status,
    decidedAt: app.decidedAt,
    decisionNote: app.decisionNote,
  };
}

async function loadMembers(): Promise<AdminMemberRow[]> {
  const members = await repoListMembers();
  const timestamps = await loadMemberTimestamps();
  return members
    .map((m) => {
      const ts = timestamps.get(m.id);
      return memberToRow(m, ts?.createdAt ?? '', ts?.updatedAt ?? '');
    })
    .sort((a, b) => (b.createdAt || b.id).localeCompare(a.createdAt || a.id));
}

async function loadEvents(): Promise<AdminEventRow[]> {
  const events = await repoListEvents();
  return events.map(eventToRow).sort((a, b) => b.startAt.localeCompare(a.startAt));
}

export async function getHanakaiAdminDashboard(): Promise<HanakaiAdminDashboard> {
  const [members, events, applicationsRaw] = await Promise.all([
    loadMembers(),
    loadEvents(),
    loadApplicationsRaw(),
  ]);

  const memberMap = new Map(members.map((m) => [m.id, m.nickname]));
  const eventMap = new Map(events.map((e) => [e.id, e.title]));

  const applications = applicationsRaw.map((a) =>
    applicationToRow(a, eventMap.get(a.eventId) ?? '（削除済みイベント）', memberMap.get(a.memberId) ?? '（不明）'),
  );

  const upcomingEvents = events.filter((e) => !e.isPast).slice(0, 5);
  const pendingApplications = applications.filter((a) => a.status === 'pending').slice(0, 8);

  const [photoUsageRequestCount, groupPostCount, reportCount] = await Promise.all([
    safeTableCount('hanakai_group_photo_usage_requests', { column: 'status', value: 'pending' }),
    safeTableCount('hanakai_group_posts'),
    countOpenReports(),
  ]);

  return {
    kpis: {
      memberCount: members.length,
      eventCount: events.length,
      upcomingEventCount: events.filter((e) => !e.isPast).length,
      applicationCount: applications.length,
      pendingApplicationCount: applications.filter((a) => a.status === 'pending').length,
      reportCount,
      photoUsageRequestCount,
      groupPostCount,
    },
    recentMembers: members.slice(0, 5),
    recentEvents: events.slice(0, 5),
    recentApplications: applications.slice(0, 5),
    pendingApplications,
    upcomingEvents,
  };
}

export async function listHanakaiAdminMembers(query = ''): Promise<AdminMemberRow[]> {
  const members = await loadMembers();
  const q = query.trim().toLowerCase();
  if (!q) return members;
  return members.filter(
    (m) =>
      m.nickname.toLowerCase().includes(q) ||
      m.area.toLowerCase().includes(q) ||
      m.lifePhaseLabel.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q),
  );
}

export async function listHanakaiAdminEvents(options?: {
  query?: string;
  category?: string;
  when?: 'upcoming' | 'past' | 'all';
}): Promise<AdminEventRow[]> {
  let events = await loadEvents();
  const q = options?.query?.trim().toLowerCase();
  if (q) {
    events = events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.hostName.toLowerCase().includes(q) ||
        e.area.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q),
    );
  }
  if (options?.category && options.category !== 'all') {
    events = events.filter((e) => e.category === options.category);
  }
  if (options?.when === 'upcoming') events = events.filter((e) => !e.isPast);
  if (options?.when === 'past') events = events.filter((e) => e.isPast);
  return events;
}

export async function listHanakaiAdminApplications(options?: {
  status?: 'pending' | 'confirmed' | 'rejected' | 'all';
  eventId?: string;
  memberQuery?: string;
}): Promise<AdminApplicationRow[]> {
  const [applicationsRaw, members, events] = await Promise.all([
    loadApplicationsRaw(),
    loadMembers(),
    loadEvents(),
  ]);
  const memberMap = new Map(members.map((m) => [m.id, m.nickname]));
  const eventMap = new Map(events.map((e) => [e.id, e.title]));

  let rows = applicationsRaw.map((a) =>
    applicationToRow(a, eventMap.get(a.eventId) ?? '（削除済みイベント）', memberMap.get(a.memberId) ?? '（不明）'),
  );

  if (options?.status && options.status !== 'all') {
    rows = rows.filter((r) => r.status === options.status);
  }
  if (options?.eventId) {
    rows = rows.filter((r) => r.eventId === options.eventId);
  }
  const mq = options?.memberQuery?.trim().toLowerCase();
  if (mq) {
    rows = rows.filter(
      (r) => r.memberNickname.toLowerCase().includes(mq) || r.memberId.toLowerCase().includes(mq),
    );
  }
  return rows;
}

export async function listHanakaiAdminEventOptions(): Promise<{ id: string; title: string }[]> {
  const events = await loadEvents();
  return events.map((e) => ({ id: e.id, title: e.title }));
}

async function countOpenReports(): Promise<number | 'unlinked'> {
  if (!useSupabase) return 0;
  try {
    const admin = await adminDb();
    if (!admin) return 0;
    const { count, error } = await admin
      .from('hanakai_reports')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'reviewing']);
    if (error) {
      console.warn('HANAKAI_ADMIN_REPORTS_COUNT_SKIP', { message: error.message });
      return 'unlinked';
    }
    return count ?? 0;
  } catch (e) {
    console.warn('HANAKAI_ADMIN_REPORTS_COUNT_FAILED', { error: String(e) });
    return 'unlinked';
  }
}

async function adminSyncGroupForConfirmedMember(
  eventId: string,
  memberId: string,
): Promise<{ ok: boolean; groupExists: boolean }> {
  const admin = await adminDb();
  if (!admin) return { ok: false, groupExists: false };

  let { data: group } = await admin
    .from('hanakai_connection_groups')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle();

  if (!group) {
    const { data: created, error: createErr } = await admin
      .from('hanakai_connection_groups')
      .insert({ event_id: eventId })
      .select('id')
      .single();
    if (createErr || !created) {
      console.warn('HANAKAI_ADMIN_GROUP_ENSURE_FAILED', { eventId, message: createErr?.message });
      return { ok: false, groupExists: false };
    }
    group = created;
  }

  const { error } = await admin.from('hanakai_group_members').upsert(
    { group_id: group.id, member_id: memberId, role: 'participant' },
    { onConflict: 'group_id,member_id' },
  );
  if (error) {
    console.error('HANAKAI_ADMIN_GROUP_MEMBER_FAILED', { eventId, memberId, message: error.message });
    return { ok: false, groupExists: true };
  }
  return { ok: true, groupExists: true };
}

export async function adminApproveApplication(
  applicationId: string,
  adminMemberId: string,
): Promise<{ ok: true; eventId: string; groupSynced: boolean } | { ok: false; error: string }> {
  if (!useSupabase) {
    const apps = await loadApplicationsRaw();
    const app = apps.find((a) => a.id === applicationId);
    if (!app) return { ok: false, error: '申請が見つかりません' };
    if (app.status !== 'pending') return { ok: false, error: 'この申請はすでに処理済みです' };
    await confirmMemberForEvent(app.eventId, app.memberId);
    return { ok: true, eventId: app.eventId, groupSynced: true };
  }

  const admin = await adminDb();
  if (!admin) return { ok: false, error: 'データベースに接続できません' };

  const { data: app, error: fetchErr } = await admin
    .from('hanakai_event_applications')
    .select('id, event_id, member_id, status')
    .eq('id', applicationId)
    .maybeSingle();

  if (fetchErr || !app) return { ok: false, error: '申請が見つかりません' };
  if (app.status !== 'pending') return { ok: false, error: 'この申請はすでに処理済みです' };

  const now = new Date().toISOString();
  const { error: updateErr } = await admin
    .from('hanakai_event_applications')
    .update({
      status: 'confirmed',
      decided_at: now,
      decided_by_member_id: adminMemberId,
    })
    .eq('id', applicationId);

  if (updateErr) return { ok: false, error: updateErr.message };

  const sync = await adminSyncGroupForConfirmedMember(String(app.event_id), String(app.member_id));
  return { ok: true, eventId: String(app.event_id), groupSynced: sync.ok };
}

export async function adminRejectApplication(
  applicationId: string,
  adminMemberId: string,
  decisionNote: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!useSupabase) {
    const apps = await loadApplicationsRaw();
    const app = apps.find((a) => a.id === applicationId);
    if (!app) return { ok: false, error: '申請が見つかりません' };
    if (app.status !== 'pending') return { ok: false, error: 'この申請はすでに処理済みです' };
    await rejectApplication(app.eventId, app.memberId);
    return { ok: true };
  }

  const admin = await adminDb();
  if (!admin) return { ok: false, error: 'データベースに接続できません' };

  const { data: app, error: fetchErr } = await admin
    .from('hanakai_event_applications')
    .select('id, status')
    .eq('id', applicationId)
    .maybeSingle();

  if (fetchErr || !app) return { ok: false, error: '申請が見つかりません' };
  if (app.status !== 'pending') return { ok: false, error: 'この申請はすでに処理済みです' };

  const now = new Date().toISOString();
  const { error: updateErr } = await admin
    .from('hanakai_event_applications')
    .update({
      status: 'rejected',
      decided_at: now,
      decided_by_member_id: adminMemberId,
      decision_note: decisionNote,
    })
    .eq('id', applicationId);

  if (updateErr) return { ok: false, error: updateErr.message };
  return { ok: true };
}

const REPORT_STATUS_LABEL: Record<AdminReportStatus, string> = {
  open: '未対応',
  reviewing: '確認中',
  resolved: '対応済み',
  dismissed: '却下',
};

const REPORT_TARGET_LABEL: Record<string, string> = {
  member: '会員',
  event: 'イベント',
  group_post: 'グループ投稿',
  group_photo: 'グループ写真',
  profile_photo: 'プロフィール写真',
  event_photo: 'イベント写真',
};

export { REPORT_STATUS_LABEL, REPORT_TARGET_LABEL };

export async function listHanakaiAdminReports(options?: {
  status?: AdminReportStatus | 'all' | 'active';
}): Promise<AdminReportRow[]> {
  if (!useSupabase) return [];

  const admin = await adminDb();
  if (!admin) return [];

  try {
    let q = admin.from('hanakai_reports').select('*').order('created_at', { ascending: false });
    const statusFilter = options?.status ?? 'active';
    if (statusFilter === 'active') {
      q = q.in('status', ['open', 'reviewing']);
    } else if (statusFilter !== 'all') {
      q = q.eq('status', statusFilter);
    }

    const { data, error } = await q;
    if (error || !data) {
      console.warn('HANAKAI_ADMIN_REPORTS_LIST_SKIP', { message: error?.message });
      return [];
    }

    const memberIds = new Set<string>();
    for (const row of data) {
      if (row.reporter_member_id) memberIds.add(String(row.reporter_member_id));
      if (row.resolved_by_member_id) memberIds.add(String(row.resolved_by_member_id));
    }
    const nicknameMap = new Map<string, string>();
    if (memberIds.size > 0) {
      const { data: members } = await admin
        .from('hanakai_members')
        .select('id, nickname')
        .in('id', [...memberIds]);
      for (const m of members ?? []) {
        nicknameMap.set(String(m.id), String(m.nickname || '（未設定）'));
      }
    }

    return data.map((row) => {
      const targetType = String(row.target_type ?? 'group_post') as AdminReportRow['targetType'];
      return {
        id: String(row.id),
        reporterMemberId: row.reporter_member_id ? String(row.reporter_member_id) : null,
        reporterNickname: row.reporter_member_id
          ? (nicknameMap.get(String(row.reporter_member_id)) ?? '（不明）')
          : '（匿名）',
        targetType,
        targetId: String(row.target_id),
        targetLabel: `${REPORT_TARGET_LABEL[targetType] ?? targetType} · ${String(row.target_id).slice(0, 8)}…`,
        reason: String(row.reason ?? ''),
        detail: String(row.detail ?? ''),
        status: row.status as AdminReportStatus,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at ?? row.created_at),
        resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
        resolvedByMemberId: row.resolved_by_member_id ? String(row.resolved_by_member_id) : null,
        resolvedByNickname: row.resolved_by_member_id
          ? (nicknameMap.get(String(row.resolved_by_member_id)) ?? '（不明）')
          : null,
      };
    });
  } catch (e) {
    console.warn('HANAKAI_ADMIN_REPORTS_LIST_FAILED', { error: String(e) });
    return [];
  }
}

export async function adminUpdateReportStatus(
  reportId: string,
  status: 'reviewing' | 'resolved' | 'dismissed',
  adminMemberId: string,
  note: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!useSupabase) return { ok: false, error: '通報管理は Supabase 環境でのみ利用できます' };

  const admin = await adminDb();
  if (!admin) return { ok: false, error: 'データベースに接続できません' };

  const { data: report, error: fetchErr } = await admin
    .from('hanakai_reports')
    .select('id, status')
    .eq('id', reportId)
    .maybeSingle();

  if (fetchErr || !report) return { ok: false, error: '通報が見つかりません' };

  const current = report.status as AdminReportStatus;
  const allowed =
    (status === 'reviewing' && current === 'open') ||
    (status === 'resolved' && current === 'reviewing') ||
    (status === 'dismissed' && (current === 'open' || current === 'reviewing'));

  if (!allowed) return { ok: false, error: 'このステータス変更はできません' };

  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    status,
    updated_at: now,
  };
  if (status === 'resolved' || status === 'dismissed') {
    payload.resolved_at = now;
    payload.resolved_by_member_id = adminMemberId;
  }
  if (note && status === 'dismissed') {
    payload.detail = note;
  }

  const { error: updateErr } = await admin.from('hanakai_reports').update(payload).eq('id', reportId);
  if (updateErr) return { ok: false, error: updateErr.message };
  return { ok: true };
}

const DEEP_ANSWER_FIELDS: { key: keyof ConnectionMember['values']; label: string }[] = [
  { key: 'mostImportant', label: 'いま大切にしていること' },
  { key: 'currentChallenge', label: '最近挑戦していること' },
  { key: 'futureGoal', label: '将来の目標' },
  { key: 'recentInspiration', label: '最近のインスピレーション' },
  { key: 'howOthersSeeMe', label: '人から言われること' },
  { key: 'personalityOneWord', label: '性格を一言で' },
  { key: 'coreValues', label: '大切にしている価値観' },
];

export async function getHanakaiAdminMemberDetail(memberId: string): Promise<AdminMemberDetail | null> {
  const member = await repoGetMember(memberId);
  if (!member) return null;

  const timestamps = await loadMemberTimestamps();
  const ts = timestamps.get(memberId);
  const baseRow = memberToRow(member, ts?.createdAt ?? '', ts?.updatedAt ?? '');

  const personalityType = member.personality?.type ?? null;
  const personalityLabel = personalityType ? (PERSONALITY_TYPE_META[personalityType]?.label ?? personalityType) : null;

  const mbtiType = member.mbtiType || null;
  const mbtiLabel =
    mbtiType && mbtiType !== 'unknown' ? (MBTI_LABEL[mbtiType as keyof typeof MBTI_LABEL] ?? mbtiType) : null;

  const socialLinks = member.socialLinks.map((link) => ({
    platform: link.platform,
    platformLabel: SOCIAL_PLATFORM_LABEL[link.platform] ?? link.platform,
    url: link.url,
    isVisibleOnProfile: link.isVisibleOnProfile,
  }));

  const purposeLabels = member.purposes.map((p) => PURPOSE_LABEL[p] ?? p);
  const interestLabels = member.interestTags.map((t) => INTEREST_TAG_LABEL[t as InterestTag] ?? t);
  const valueTagLabels = (member.values.valueTags ?? []).map((t) => VALUE_TAG_LABEL[t as ValueTag] ?? t);

  const deepAnswers = DEEP_ANSWER_FIELDS.map(({ key, label }) => ({
    label,
    value: String(member.values[key] ?? ''),
  }));

  const [applicationsRaw, events, groupHistory, postCount, photoCount, reportCount] = await Promise.all([
    loadApplicationsRaw(),
    loadEvents(),
    loadMemberGroupHistory(memberId),
    countMemberPosts(memberId),
    countMemberPhotos(memberId),
    countMemberReports(memberId),
  ]);

  const eventMap = new Map(events.map((e) => [e.id, e]));
  const memberApps = applicationsRaw.filter((a) => a.memberId === memberId);

  const applicationHistory = memberApps.map((a) => ({
    id: a.id,
    eventId: a.eventId,
    eventTitle: eventMap.get(a.eventId)?.title ?? '（削除済みイベント）',
    status: a.status,
    appliedAt: a.appliedAt,
    decidedAt: a.decidedAt,
  }));

  const confirmedEvents = memberApps
    .filter((a) => a.status === 'confirmed')
    .map((a) => {
      const ev = eventMap.get(a.eventId);
      return { id: a.eventId, title: ev?.title ?? '（削除済み）', startAt: ev?.startAt ?? '' };
    });

  const hosted = await loadHostedEventsForMember(memberId);

  const considerations =
    member.trustNotes?.trim() ||
    (member.safetyFlags.length > 0 ? member.safetyFlags.join('、') : '');

  return {
    member: baseRow,
    bio: member.bio,
    occupation: member.occupation,
    purposes: member.purposes,
    purposeLabels,
    interestTags: member.interestTags,
    interestLabels,
    valueTags: member.values.valueTags ?? [],
    valueTagLabels,
    personalityType,
    personalityLabel,
    mbtiType,
    mbtiLabel,
    socialLinks,
    introductionAiGenerated: member.introductionAiGenerated,
    introductionGeneratedAt: member.introductionGeneratedAt,
    deepAnswers,
    desiredConnection: purposeLabels.join('、') || '',
    considerations,
    safetyFlags: member.safetyFlags,
    trustNotes: member.trustNotes,
    adminNotePhase: 'phase3',
    applicationHistory,
    confirmedEvents,
    hostedEvents: hosted,
    groupHistory,
    postCount,
    photoCount,
    reportCount,
  };
}

async function loadHostedEventsForMember(
  memberId: string,
): Promise<{ id: string; title: string; startAt: string }[]> {
  if (!useSupabase) {
    const rawEvents = await repoListEvents();
    return rawEvents
      .filter((e) => e.hostId === memberId)
      .map((e) => ({ id: e.id, title: e.title, startAt: e.startAt }));
  }
  try {
    const admin = await adminDb();
    if (!admin) return [];
    const { data } = await admin
      .from('hanakai_events')
      .select('id, title, start_at')
      .eq('host_member_id', memberId)
      .order('start_at', { ascending: false });
    return (data ?? []).map((row) => ({
      id: String(row.id),
      title: String(row.title),
      startAt: String(row.start_at),
    }));
  } catch {
    return [];
  }
}

async function loadMemberGroupHistory(memberId: string): Promise<AdminMemberDetail['groupHistory']> {
  if (!useSupabase) return [];
  try {
    const admin = await adminDb();
    if (!admin) return [];
    const { data: memberships } = await admin
      .from('hanakai_group_members')
      .select('group_id, role, joined_at')
      .eq('member_id', memberId)
      .order('joined_at', { ascending: false });
    if (!memberships?.length) return [];

    const groupIds = memberships.map((m) => String(m.group_id));
    const { data: groups } = await admin
      .from('hanakai_connection_groups')
      .select('id, event_id')
      .in('id', groupIds);
    const eventIds = (groups ?? []).map((g) => String(g.event_id));
    const { data: eventRows } = await admin.from('hanakai_events').select('id, title').in('id', eventIds);
    const eventTitleMap = new Map((eventRows ?? []).map((e) => [String(e.id), String(e.title)]));
    const groupEventMap = new Map((groups ?? []).map((g) => [String(g.id), String(g.event_id)]));

    return memberships.map((m) => {
      const gid = String(m.group_id);
      const eventId = groupEventMap.get(gid) ?? '';
      return {
        groupId: gid,
        eventId,
        eventTitle: eventTitleMap.get(eventId) ?? '（不明）',
        role: String(m.role ?? 'participant'),
        joinedAt: String(m.joined_at ?? ''),
      };
    });
  } catch {
    return [];
  }
}

async function countMemberPosts(memberId: string): Promise<number> {
  if (!useSupabase) return 0;
  try {
    const admin = await adminDb();
    if (!admin) return 0;
    const { count } = await admin
      .from('hanakai_group_posts')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId);
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countMemberPhotos(memberId: string): Promise<number> {
  if (!useSupabase) return 0;
  try {
    const admin = await adminDb();
    if (!admin) return 0;
    const [profile, group] = await Promise.all([
      admin.from('hanakai_member_photos').select('*', { count: 'exact', head: true }).eq('member_id', memberId),
      admin.from('hanakai_group_photos').select('*', { count: 'exact', head: true }).eq('member_id', memberId),
    ]);
    return (profile.count ?? 0) + (group.count ?? 0);
  } catch {
    return 0;
  }
}

async function countMemberReports(memberId: string): Promise<number> {
  if (!useSupabase) return 0;
  try {
    const admin = await adminDb();
    if (!admin) return 0;
    const { count } = await admin
      .from('hanakai_reports')
      .select('*', { count: 'exact', head: true })
      .or(`target_id.eq.${memberId},reporter_member_id.eq.${memberId}`);
    return count ?? 0;
  } catch {
    return 0;
  }
}
