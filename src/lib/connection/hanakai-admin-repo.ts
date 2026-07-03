import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import { EVENT_CATEGORY_LABEL, LIFE_PHASE_LABEL } from '@/lib/connection/data';
import {
  listApplications as repoListApplications,
  listEvents as repoListEvents,
  listMembers as repoListMembers,
} from '@/lib/connection/repo';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  AdminApplicationRow,
  AdminEventRow,
  AdminMemberRow,
  AdminMemberStatus,
  HanakaiAdminDashboard,
} from '@/lib/connection/hanakai-admin-types';
import type { ConnectionEventCategory, ConnectionMember, LifePhase } from '@/lib/connection/types';

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
    status: memberStatus(member),
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
};

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
      .select('id, event_id, member_id, applied_at, status, reason, decided_at')
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

  const [photoUsageRequestCount, groupPostCount] = await Promise.all([
    safeTableCount('hanakai_group_photo_usage_requests', { column: 'status', value: 'pending' }),
    safeTableCount('hanakai_group_posts'),
  ]);

  return {
    kpis: {
      memberCount: members.length,
      eventCount: events.length,
      upcomingEventCount: events.filter((e) => !e.isPast).length,
      applicationCount: applications.length,
      pendingApplicationCount: applications.filter((a) => a.status === 'pending').length,
      reportCount: 'unlinked',
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
