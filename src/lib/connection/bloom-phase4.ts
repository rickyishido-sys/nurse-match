import { HANAKAI_CONNECTION_BACKEND } from '@/lib/config';
import * as repo from '@/lib/connection/bloom-phase4-repo';

const useSupabase = HANAKAI_CONNECTION_BACKEND === 'supabase';

export async function listBloomTimeline(memberId: string) {
  return useSupabase ? repo.listBloomTimeline(memberId) : [];
}

export async function listBloomMemories(memberId: string) {
  return useSupabase ? repo.listBloomMemories(memberId) : [];
}

export async function listBloomVersions(memberId: string) {
  return useSupabase ? repo.listBloomVersions(memberId) : [];
}

export async function getBloomPhase4Settings(memberId: string) {
  return useSupabase
    ? repo.getBloomPhase4Settings(memberId)
    : { aiReflection: '', showTimeline: true, showMemories: false, showReflection: true };
}

export async function getBloomMemoryForEvent(memberId: string, eventId: string) {
  return useSupabase ? repo.getBloomMemoryForEvent(memberId, eventId) : null;
}

export {
  saveBloomMemory,
  saveBloomPhase4Visibility,
  saveAiReflection,
  recordBloomProfileGenerated,
  snapshotBeforeBloomUpdate,
  recordEventJoinedTimeline,
  addBloomTimelineEntry,
} from '@/lib/connection/bloom-phase4-repo';
