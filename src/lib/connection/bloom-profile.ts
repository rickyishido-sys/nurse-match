import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import * as bloomRepo from '@/lib/connection/bloom-profile-repo';
import { EMPTY_BLOOM_PROFILE, type BloomProfile } from '@/lib/connection/bloom-profile-types';

const useSupabase = HANAKAI_CONNECTION_BACKEND === 'supabase';

export async function getBloomProfile(memberId: string): Promise<BloomProfile | null> {
  if (!useSupabase) return null;
  return bloomRepo.getBloomProfile(memberId);
}

export async function getBloomProfileOrEmpty(memberId: string): Promise<BloomProfile> {
  if (!useSupabase) return EMPTY_BLOOM_PROFILE(memberId);
  return bloomRepo.getBloomProfileOrEmpty(memberId);
}

export {
  upsertBloomProfile,
  saveBloomVisibility,
  saveGeneratedBloomProfile,
} from '@/lib/connection/bloom-profile-repo';
