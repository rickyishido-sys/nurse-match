'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/data';
import { fetchAllNews } from '@/lib/news/fetch-news';
import { saveNewsSnapshot } from '@/lib/news/store';

export async function refreshNewsAction() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  if (user.role !== 'super_admin') redirect('/home');

  const snapshot = await fetchAllNews();
  await saveNewsSnapshot(snapshot);
  revalidatePath('/');
  revalidatePath('/admin/news');
  redirect('/admin/news?refreshed=1');
}
