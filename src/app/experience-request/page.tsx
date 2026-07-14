import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { ExperienceRequestForm } from '@/components/connection/experience-request-form';
import { getHanakaiViewer } from '@/lib/hanakai/session';

const GOLD = '#b8956a';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export const metadata = {
  title: '体験リクエスト',
  description: '参加したい体験をリクエストして、新しいイベントのきっかけに',
};

export default async function ExperienceRequestPage({ searchParams }: PageProps) {
  const viewer = await getHanakaiViewer();
  const sp = searchParams ? await searchParams : {};
  const sent = sp.sent === '1';
  const error = sp.error === 'required';

  return (
    <ConnectionShell viewer={viewer}>
      <div className='mx-auto max-w-[640px] space-y-8'>
        <div className='space-y-2'>
          <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
            EXPERIENCE REQUEST
          </p>
          <h1 className='text-[1.6rem] font-semibold leading-tight tracking-tight text-[#1a1a1a]'>
            あなたはどんな体験をしてみたいですか？
          </h1>
          <p className='text-sm leading-7 text-[#6b6b6b]'>
            イベントが決まっていなくても大丈夫。
            あなたの「参加したい」が集まることで、新しい体験イベントが生まれます。
          </p>
        </div>

        {sent ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-sm text-[#1f5d4f]'>
            体験リクエストを受け付けました。需要が集まり次第、新しいイベントの企画につなげます。
          </p>
        ) : null}

        {error ? (
          <p className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
            必須項目を入力してください（カテゴリー・地域・希望曜日・年代）。
          </p>
        ) : null}

        <section className='rounded-3xl border border-[#ebe5dc] bg-white p-6 shadow-[0_2px_12px_rgba(26,26,26,0.04)] sm:p-8'>
          <ExperienceRequestForm />
        </section>

        <Link
          href='/events'
          prefetch
          className='inline-flex h-11 items-center justify-center rounded-full border border-[#d8d6d1] px-6 text-sm font-medium text-[#6b6b6b] transition hover:border-[#1f5d4f]/30 hover:text-[#1f5d4f] active:scale-[0.98]'
        >
          イベント一覧へ
        </Link>
      </div>
    </ConnectionShell>
  );
}
