import { redirect } from 'next/navigation';
import { getCurrentUser, getFemaleProfileByUserId, getMaleProfileByUserId } from '@/lib/data';
import type { AppAccessState, AppUser } from '@/lib/types/domain';

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function getAccessState(user: AppUser): Promise<AppAccessState> {
  if (user.isSuspended) return 'suspended';
  if (user.verificationStatus === 'rejected') return 'rejected';
  if (user.verificationStatus !== 'approved') return 'pending';

  if (user.gender === 'female') {
    const profile = await getFemaleProfileByUserId(user.id);
    if (!profile) return 'pending';
    if (profile.nurseVerificationStatus === 'rejected') return 'rejected';
    if (profile.nurseVerificationStatus !== 'approved') return 'pending';
    return 'approved';
  }

  const maleProfile = await getMaleProfileByUserId(user.id);
  if (!maleProfile) return 'pending';
  if (maleProfile.maleReviewStatus === 'rejected') return 'rejected';
  if (maleProfile.maleReviewStatus !== 'approved') return 'pending';
  return 'approved';
}

export async function redirectByAccessState(user: AppUser) {
  const state = await getAccessState(user);
  if (state === 'suspended') redirect('/suspended');
  if (state === 'rejected') redirect('/rejected');
  if (state === 'pending') redirect('/pending-review');
}
