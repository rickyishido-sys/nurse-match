import { HanakaiShell } from '@/components/hanakai/shell';
import { createPostAction } from '@/lib/hanakai/actions';
import { listEvents } from '@/lib/hanakai/data';
import { getHanakaiViewer } from '@/lib/hanakai/session';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function NewPostPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : {};
  const viewer = await getHanakaiViewer();
  const events = listEvents();
  const error = sp.error;

  return (
    <HanakaiShell viewer={viewer}>
      <div className='space-y-4'>
        <h1 className='text-lg font-bold text-slate-800'>作品を投稿する</h1>
        {error === 'title' ? <p className='rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-600'>タイトルを入力してください。</p> : null}
        <form action={createPostAction} className='space-y-4'>
          <label className='block'>
            <span className='mb-1 block text-xs font-semibold text-slate-600'>作品の写真</span>
            <input type='file' name='image' accept='image/*' className='w-full rounded-2xl border border-[#e0e7db] bg-white px-3 py-2.5 text-sm' />
          </label>
          <label className='block'>
            <span className='mb-1 block text-xs font-semibold text-slate-600'>タイトル</span>
            <input name='title' placeholder='例: 桜の枝とスイートピー' className='w-full rounded-2xl border border-[#e0e7db] bg-white px-4 py-2.5 text-sm' />
          </label>
          <label className='block'>
            <span className='mb-1 block text-xs font-semibold text-slate-600'>本文</span>
            <textarea name='body' rows={4} placeholder='込めた想いや、いけたときのことを…' className='w-full rounded-2xl border border-[#e0e7db] bg-white px-4 py-2.5 text-sm' />
          </label>
          <label className='block'>
            <span className='mb-1 block text-xs font-semibold text-slate-600'>使用した花（カンマ区切り）</span>
            <input name='flowers' placeholder='桜, スイートピー, ユーカリ' className='w-full rounded-2xl border border-[#e0e7db] bg-white px-4 py-2.5 text-sm' />
          </label>
          <label className='block'>
            <span className='mb-1 block text-xs font-semibold text-slate-600'>参加した花会</span>
            <select name='eventId' className='w-full rounded-2xl border border-[#e0e7db] bg-white px-4 py-2.5 text-sm'>
              <option value=''>選択しない</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </label>
          <label className='block'>
            <span className='mb-1 block text-xs font-semibold text-slate-600'>タグ（カンマ区切り）</span>
            <input name='tags' placeholder='ナチュラル, 枝もの' className='w-full rounded-2xl border border-[#e0e7db] bg-white px-4 py-2.5 text-sm' />
          </label>
          <button className='h-12 w-full rounded-2xl bg-[#4f7a4a] text-sm font-bold text-white'>投稿する</button>
        </form>
      </div>
    </HanakaiShell>
  );
}
