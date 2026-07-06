import { requireHanakaiAdminAccess } from '@/lib/connection/hanakai-admin-access';

export const metadata = {
  title: '運営管理',
  robots: { index: false, follow: false },
};

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  await requireHanakaiAdminAccess('/manage');
  return children;
}
