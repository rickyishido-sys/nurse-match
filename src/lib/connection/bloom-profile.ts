import { cache } from 'react';
import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import * as bloomRepo from '@/lib/connection/bloom-profile-repo';
import { EMPTY_BLOOM_PROFILE, type BloomProfile } from '@/lib/connection/bloom-profile-types';

const useSupabase = HANAKAI_CONNECTION_BACKEND === 'supabase';

/** Request-scoped dedupe only. */
export const getBloomProfile = cache(async function getBloomProfile(
  memberId: string,
): Promise<BloomProfile | null> {
  if (!useSupabase) return null;
  return bloomRepo.getBloomProfile(memberId);
});

export async function getBloomProfileOrEmpty(memberId: string): Promise<BloomProfile> {
  if (!useSupabase) return EMPTY_BLOOM_PROFILE(memberId);
  return bloomRepo.getBloomProfileOrEmpty(memberId);
}

/** Batch bloom for list cards (one query). */
export async function getBloomProfilesByIds(memberIds: string[]): Promise<Map<string, BloomProfile>> {
  if (!useSupabase) return new Map();
  return bloomRepo.getBloomProfilesByIds(memberIds);
}

export {
  upsertBloomProfile,
  saveBloomVisibility,
  saveGeneratedBloomProfile,
} from '@/lib/connection/bloom-profile-repo';
