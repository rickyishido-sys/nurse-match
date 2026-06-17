import Link from 'next/link';
import { ConnectionProfileForm } from '@/components/connection/profile-form';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function RegisterProfilePage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const error = pickFirst(sp.error);

  return (
    <main className='min-h-screen bg-[#fafaf8] px-5 py-8'>
      <div className='mx-auto w-full max-w-[420px]'>
        <div className='mb-8'>
          <Link href='/' className='flex flex-col'>
            <span className='text-[15px] font-semibold tracking-[0.12em] text-[#1a1a1a]'>HANAKAI</span>
            <span className='text-[11px] font-medium tracking-[0.2em] text-[#6b6b6b]'>CONNECTION</span>
          </Link>
        </div>

        <h1 className='text-xl font-semibold text-[#1a1a1a]'>プロフィール登録</h1>
        <p className='mt-2 mb-6 text-sm leading-7 text-[#6b6b6b]'>
          Connection Eventに参加するためのプロフィールを入力してください。
        </p>

        <ConnectionProfileForm error={error || undefined} />
      </div>
    </main>
  );
}
