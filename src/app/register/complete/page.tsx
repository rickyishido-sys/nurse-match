import Link from 'next/link';
import { getMember } from '@/lib/connection/data';
import { PERSONALITY_TYPE_META } from '@/lib/connection/personality';

const MOCK_VIEWER_ID = 'm1';

export default function RegisterCompletePage() {
  const member = getMember(MOCK_VIEWER_ID);
  const personality = member?.personality ? PERSONALITY_TYPE_META[member.personality.type] : null;

  return (
    <main className='min-h-screen bg-[#fafaf8] px-5 py-10'>
      <div className='mx-auto w-full max-w-[420px]'>
        <div className='mb-8 flex flex-col items-center text-center'>
          <span className='text-[15px] font-semibold tracking-[0.12em] text-[#1a1a1a]'>HANAKAI</span>
          <span className='text-[11px] font-medium tracking-[0.2em] text-[#6b6b6b]'>CONNECTION</span>
        </div>

        <div className='rounded-3xl border border-[#ebe9e4] bg-white px-6 py-10 text-center shadow-[0_1px_0_rgba(0,0,0,0.02)]'>
          <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f3efe9] text-2xl'>
            🌸
          </div>
          <h1 className='mt-5 text-xl font-semibold text-[#1a1a1a]'>登録が完了しました</h1>
          <p className='mt-3 text-sm leading-7 text-[#6b6b6b]'>
            {member?.nickname ? `${member.nickname}さん、` : ''}ようこそHANAKAI Connectionへ。
            <br />
            あなたの価値観に合うConnectionが待っています。
          </p>

          {personality ? (
            <div className='mt-6 rounded-2xl bg-[#faf8f4] px-4 py-4'>
              <p className='text-[11px] font-medium tracking-[0.2em] text-[#9a9a9a]'>あなたのConnectionタイプ</p>
              <p className='mt-1 text-lg font-semibold text-[#1a1a1a]'>{personality.label}</p>
              <p className='mt-1 text-xs leading-6 text-[#6b6b6b]'>{personality.description}</p>
            </div>
          ) : null}
        </div>

        <div className='mt-6 grid gap-3'>
          <Link
            href='/events'
            className='flex h-12 items-center justify-center rounded-full bg-[#1a1a1a] text-sm font-semibold text-white'
          >
            あなたに合いそうなConnection Eventを見る
          </Link>
          <Link
            href='/register/profile'
            className='flex h-12 items-center justify-center rounded-full border border-[#1a1a1a] text-sm font-semibold text-[#1a1a1a]'
          >
            プロフィールを確認する
          </Link>
        </div>
      </div>
    </main>
  );
}
