import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  EXPERIENCE_REQUEST_AGE_GROUPS,
  EXPERIENCE_REQUEST_CATEGORIES,
  EXPERIENCE_REQUEST_DAYS,
  type ExperienceRequestAgeGroup,
  type ExperienceRequestCategory,
  type ExperienceRequestDay,
} from '@/lib/connection/experience-request-constants';

export type SubmitExperienceRequestInput = {
  userId: string | null;
  categories: ExperienceRequestCategory[];
  prefecture: string;
  city: string;
  preferredDays: ExperienceRequestDay[];
  ageGroup: ExperienceRequestAgeGroup;
  comment: string;
};

const CATEGORY_SET = new Set<string>(EXPERIENCE_REQUEST_CATEGORIES);
const DAY_SET = new Set<string>(EXPERIENCE_REQUEST_DAYS);
const AGE_SET = new Set<string>(EXPERIENCE_REQUEST_AGE_GROUPS);

export function parseExperienceRequestForm(formData: FormData): SubmitExperienceRequestInput | null {
  const categories = formData
    .getAll('category')
    .map((v) => String(v).trim())
    .filter((v): v is ExperienceRequestCategory => CATEGORY_SET.has(v));
  const prefecture = String(formData.get('prefecture') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const preferredDays = formData
    .getAll('preferred_day')
    .map((v) => String(v).trim())
    .filter((v): v is ExperienceRequestDay => DAY_SET.has(v));
  const ageGroup = String(formData.get('age_group') ?? '').trim() as ExperienceRequestAgeGroup;
  const comment = String(formData.get('comment') ?? '').trim();

  if (categories.length === 0 || !prefecture || !city || preferredDays.length === 0 || !AGE_SET.has(ageGroup)) {
    return null;
  }

  return { userId: null, categories, prefecture, city, preferredDays, ageGroup, comment };
}

export async function submitExperienceRequest(input: SubmitExperienceRequestInput): Promise<void> {
  const sb = await createServerSupabaseClient();
  if (!sb) throw new Error('Supabase client unavailable');

  const { error } = await sb.from('experience_requests').insert({
    user_id: input.userId,
    category: input.categories,
    prefecture: input.prefecture,
    city: input.city,
    preferred_day: input.preferredDays,
    age_group: input.ageGroup,
    comment: input.comment || null,
  });

  if (error) {
    console.error('EXPERIENCE_REQUEST_INSERT_FAILED', { message: error.message, code: error.code });
    throw new Error('体験リクエストの送信に失敗しました');
  }
}

export type ExperienceRequestRow = {
  id: string;
  userId: string | null;
  categories: string[];
  prefecture: string;
  city: string;
  preferredDays: string[];
  ageGroup: string;
  comment: string | null;
  createdAt: string;
};

export type ExperienceRequestGroupSummary = {
  category: string;
  prefecture: string;
  city: string;
  count: number;
};

function mapRow(row: Record<string, unknown>): ExperienceRequestRow {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    categories: Array.isArray(row.category) ? row.category.map(String) : [],
    prefecture: String(row.prefecture ?? ''),
    city: String(row.city ?? ''),
    preferredDays: Array.isArray(row.preferred_day) ? row.preferred_day.map(String) : [],
    ageGroup: String(row.age_group ?? ''),
    comment: row.comment ? String(row.comment) : null,
    createdAt: String(row.created_at ?? ''),
  };
}

export async function listExperienceRequestGroups(): Promise<ExperienceRequestGroupSummary[]> {
  const admin = createAdminSupabaseClient();
  if (!admin) return [];

  const { data, error } = await admin.from('experience_requests').select('category, prefecture, city');
  if (error || !data) {
    console.error('EXPERIENCE_REQUEST_GROUP_LIST_FAILED', error?.message);
    return [];
  }

  const counts = new Map<string, ExperienceRequestGroupSummary>();
  for (const row of data) {
    const categories = Array.isArray(row.category) ? row.category.map(String) : [];
    const prefecture = String(row.prefecture ?? '');
    const city = String(row.city ?? '');
    for (const category of categories) {
      const key = `${category}\0${prefecture}\0${city}`;
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, { category, prefecture, city, count: 1 });
      }
    }
  }

  return [...counts.values()].sort((a, b) => b.count - a.count || a.category.localeCompare(b.category, 'ja'));
}

export async function listExperienceRequestsByGroup(
  category: string,
  prefecture: string,
  city: string,
): Promise<ExperienceRequestRow[]> {
  const admin = createAdminSupabaseClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from('experience_requests')
    .select('*')
    .contains('category', [category])
    .eq('prefecture', prefecture)
    .eq('city', city)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('EXPERIENCE_REQUEST_DETAIL_LIST_FAILED', error?.message);
    return [];
  }

  return data.map((row) => mapRow(row as Record<string, unknown>));
}
