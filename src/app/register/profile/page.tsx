import Link from 'next/link';
import { ConnectionProfileForm } from '@/components/connection/profile-form';
import { getMember } from '@/lib/connection/data';

const MOCK_VIEWER_ID = 'm1';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function RegisterProfilePage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const error = pickFirst(sp.error);
  const saved = pickFirst(sp.saved);
  const member = getMember(MOCK_VIEWER_ID);

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
        <p className='mt-2 mb-2 text-sm leading-7 text-[#6b6b6b]'>
          Connection Eventに参加するためのプロフィールを入力してください。属性だけでなく、価値観や人柄も大切にします。
        </p>

        {saved === 'personality' ? (
          <p className='mb-4 rounded-2xl border border-[#ebe9e4] bg-white px-4 py-3 text-xs text-[#4a4a4a]'>
            性格診断結果を保存しました。プロフィールの残りを入力して登録を完了してください。
          </p>
        ) : null}

        <ConnectionProfileForm error={error || undefined} member={member} />
      </div>
    </main>
  );
}
