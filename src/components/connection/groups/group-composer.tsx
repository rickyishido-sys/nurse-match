'use client';

import { useRef, useState } from 'react';
import { postGroupMessageAction } from '@/lib/connection/group-actions';

type GroupComposerProps = {
  eventId: string;
};

export function GroupComposer({ eventId }: GroupComposerProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [consent, setConsent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const form = e.currentTarget;
    const body = (form.elements.namedItem('body') as HTMLTextAreaElement).value.trim();
    if (photoCount > 0 && !consent) return;
    if (!body && photoCount === 0) return;

    setPending(true);
    try {
      const fd = new FormData(form);
      await postGroupMessageAction(fd);
      form.reset();
      setPhotoCount(0);
      setConsent(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className='space-y-4'>
      <input type='hidden' name='eventId' value={eventId} />

      <div>
        <label htmlFor='group-body' className='sr-only'>
          メッセージ
        </label>
        <textarea
          id='group-body'
          name='body'
          rows={3}
          placeholder='今日はありがとうございました。など、ひとこと残せます。'
          className='w-full resize-none rounded-2xl border border-[#e8e4dc] bg-[#faf9f6] px-4 py-3 text-sm leading-7 text-[#1a1a1a] placeholder:text-[#b8b4ac] focus:border-[#1f5d4f] focus:outline-none focus:ring-1 focus:ring-[#1f5d4f]/30'
        />
      </div>

      <div className='rounded-2xl border border-dashed border-[#d8d4cc] bg-[#faf9f6] px-4 py-4'>
        <label className='flex cursor-pointer flex-col items-center gap-2 text-center'>
          <span className='text-xs font-medium text-[#6b6b6b]'>写真を添付（最大10枚 · 各10MB以下）</span>
          <span className='rounded-full border border-[#1f5d4f] px-4 py-1.5 text-xs font-semibold text-[#1f5d4f]'>
            写真を選ぶ
          </span>
          <input
            type='file'
            name='photos'
            accept='image/jpeg,image/png,image/webp'
            multiple
            className='sr-only'
            onChange={(ev) => setPhotoCount(ev.target.files?.length ?? 0)}
          />
        </label>
        {photoCount > 0 ? (
          <p className='mt-2 text-center text-[11px] text-[#1f5d4f]'>{photoCount}枚選択中</p>
        ) : null}
      </div>

      {photoCount > 0 ? (
        <label className='flex gap-3 rounded-2xl border border-[#ebe9e4] bg-white px-4 py-3 text-xs leading-6 text-[#4a4a4a]'>
          <input
            type='checkbox'
            name='consent'
            checked={consent}
            onChange={(ev) => setConsent(ev.target.checked)}
            className='mt-1 shrink-0 accent-[#1f5d4f]'
          />
          <span>
            他の参加者の顔がはっきり写っている写真を投稿する場合は、本人の許可を得てください。投稿された写真はこのイベントの参加者限定グループ内で共有されます。HANAKAIの紹介素材として利用する場合は、別途許可を確認します。
          </span>
        </label>
      ) : null}

      <button
        type='submit'
        disabled={pending || (photoCount > 0 && !consent)}
        className='h-11 w-full rounded-full bg-[#1f5d4f] text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-40'
      >
        {pending ? '送信中…' : '投稿する'}
      </button>
    </form>
  );
}
