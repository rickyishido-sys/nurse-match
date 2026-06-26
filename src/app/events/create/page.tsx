import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { CreateEventForm } from '@/components/connection/events/create-event-form';
import { EVENT_CATEGORY_CREATE_ORDER, EVENT_CATEGORY_META } from '@/lib/connection/data';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function CreateEventPage({ searchParams }: PageProps) {
  const viewer = await getHanakaiViewer();
  const sp = searchParams ? await searchParams : {};
  const error = sp.error === 'required';

  const categories = EVENT_CATEGORY_CREATE_ORDER.map((value) => ({
    value,
    label: EVENT_CATEGORY_META[value].short,
    emoji: EVENT_CATEGORY_META[value].emoji,
  }));

  return (
    <ConnectionShell viewer={viewer}>
      <div className='space-y-7'>
        <div className='space-y-3'>
          <Link href='/events' className='text-xs font-medium text-[#6b6b6b] underline-offset-2 hover:underline'>
            ← イベント一覧へ
          </Link>
          <div>
            <p className='text-xs font-semibold tracking-[0.18em] text-[#1f5d4f]'>HOST YOUR CONNECTION</p>
            <h1 className='mt-2 text-2xl font-semibold leading-snug text-[#1a1a1a]'>
              あなたのConnectionを
              <br />
              ひらく
            </h1>
            <p className='mt-3 text-sm leading-7 text-[#6b6b6b]'>
              知らない誰かと、心地よい時間を。少人数で、丁寧に。
              <br />
              主催者であるあなたが、参加する人を選べます。
            </p>
          </div>
        </div>

        {error ? (
          <p className='rounded-2xl border border-[#f0d3d9] bg-[#fbf2f4] px-4 py-3 text-xs text-[#c0526b]'>
            イベント名・開催日時・エリアは必須です。もう一度ご確認ください。
          </p>
        ) : null}

        <CreateEventForm categories={categories} />
      </div>
    </ConnectionShell>
  );
}
