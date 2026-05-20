import { redirect } from 'next/navigation';
import { getAccessState, requireUser } from '@/lib/guard';

export default async function HomeRouterPage() {
  const user = await requireUser();

  const state = await getAccessState(user);
  if (state === 'suspended') redirect('/suspended');
  if (state === 'rejected') redirect('/rejected');
  if (state === 'pending') redirect('/pending-review');

  if (user.role === 'admin') {
    redirect('/admin');
  }

  redirect(user.gender === 'female' ? '/home/female' : '/home/male');
}
