import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { getCurrentUser } from '@/lib/data';

export default async function PrivacyPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <section className='space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
        <h1 className='text-xl font-bold text-slate-900'>プライバシーポリシー</h1>
        <p className='text-sm leading-7 text-slate-600'>
          本人確認書類・看護師資格書類は審査のために利用し、一般ユーザーには表示しません。管理者のみ審査目的で閲覧します。
        </p>
        <ul className='space-y-2 text-sm text-slate-600'>
          <li>・個人情報は審査・安全対策のために必要最小限で利用</li>
          <li>・権限のない第三者への開示は行わない</li>
          <li>・退会時のデータ保持ポリシーは別途定義</li>
        </ul>
        <Link href='/community-guidelines' className='inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm text-white'>
          コミュニティガイドラインへ
        </Link>
      </section>
    </AppShell>
  );
}
