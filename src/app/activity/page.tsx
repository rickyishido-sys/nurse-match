import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { ActivityTabs } from '@/components/activity-tabs';
import { getActivityFeed, getCurrentUser } from '@/lib/data';
import { getAccessState, isAdminRole } from '@/lib/guard';

export default async function ActivityPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!isAdminRole(user.role)) {
    const state = await getAccessState(user);
    if (state === 'rejected') redirect('/review-rejected');
    if (state === 'suspended') redirect('/suspended');
    if (user.onboardingStatus !== 'verified') redirect('/preview');
    if (state === 'pending') redirect('/pending-review');
  }

  const feed = await getActivityFeed(user.id);

  return (
    <AppShell user={user}>
      <ActivityTabs userId={user.id} selfProfileImageUrl={user.profileImageUrl} incoming={feed.incoming} outgoing={feed.outgoing} matches={feed.matches} />
    </AppShell>
  );
}
