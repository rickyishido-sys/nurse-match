import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { LandingHero } from '@/components/landing-hero';
import { getCurrentUser } from '@/lib/data';

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <section className='space-y-4'>
        <LandingHero />
        <article className='rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs leading-6 text-slate-500 shadow-sm'>
          審査通過後に利用開始できます。登録前に
          <Link href='/terms' className='mx-1 text-slate-700 underline'>
            利用規約
          </Link>
          と
          <Link href='/privacy' className='mx-1 text-slate-700 underline'>
            プライバシーポリシー
          </Link>
          をご確認ください。
        </article>
      </section>
    </AppShell>
  );
}
