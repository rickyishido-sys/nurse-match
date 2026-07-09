import { redirect } from 'next/navigation';
import { getHanakaiViewer } from '@/lib/hanakai/session';

/** HANAKAI マイページ（メール CTA 用）。ログイン済み → プロフィール、未ログイン → ログイン */
export default async function MyPage() {
  const viewer = await getHanakaiViewer();
  if (viewer) {
    redirect('/my-profile');
  }
  redirect('/login?next=/my');
}
