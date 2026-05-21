import { redirect } from 'next/navigation';
import { getAccessState, isAdminRole, requireUser } from '@/lib/guard';

export default async function HomeRouterPage() {
  const user = await requireUser();

  if (isAdminRole(user.role)) {
    if (user.role === 'female_admin') redirect('/admin/female');
    if (user.role === 'male_admin') redirect('/admin/male');
    redirect('/admin');
  }

  const state = await getAccessState(user);
  if (state === 'suspended') redirect('/suspended');
  if (state === 'rejected') redirect('/rejected');
  if (user.onboardingStatus === 'provisional') redirect('/preview');
  if (user.onboardingStatus === 'profile_completed') redirect('/pending-review');
  if (state === 'pending') redirect('/pending-review');

  redirect(user.gender === 'female' ? '/home/female' : '/home/male');
}
