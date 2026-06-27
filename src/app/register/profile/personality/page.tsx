import Link from 'next/link';
import { PersonalityQuiz } from '@/components/connection/personality-quiz';
import { getMember } from '@/lib/connection/repo';
import { getViewerMemberId } from '@/lib/connection/identity';

export default async function PersonalityPage() {
  const viewerMemberId = await getViewerMemberId();
  const member = viewerMemberId ? await getMember(viewerMemberId) : null;

  return (
    <main className='min-h-screen bg-[#fafaf8] px-5 py-8'>
      <div className='mx-auto w-full max-w-[420px]'>
        <Link href='/register/profile' className='text-xs text-[#6b6b6b] underline-offset-2 hover:underline'>
          ← プロフィールに戻る
        </Link>

        <h1 className='mt-6 text-xl font-semibold text-[#1a1a1a]'>性格診断</h1>
        <p className='mt-2 mb-6 text-sm leading-7 text-[#6b6b6b]'>
          外向/内向・論理/感覚・計画/柔軟の3軸から、あなたのConnectionタイプを判定します。
          マッチングアプリではなく、相互理解を深めるための参考情報です。
        </p>

        <PersonalityQuiz existing={member?.personality} />
      </div>
    </main>
  );
}
