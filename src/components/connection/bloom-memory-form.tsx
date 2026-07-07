'use client';

import { useState } from 'react';
import { saveBloomMemoryAction, skipBloomMemoryPromptAction } from '@/lib/connection/bloom-phase4-actions';
import type { BloomMemory } from '@/lib/connection/bloom-phase4-types';

type Props = {
  eventId: string;
  eventTitle: string;
  existing?: BloomMemory | null;
  variant: 'prompt' | 'inline';
  returnTo?: 'connection' | 'profile';
};

export function BloomMemoryForm({ eventId, eventTitle, existing, variant, returnTo = 'connection' }: Props) {
  const [memory, setMemory] = useState(existing?.memory ?? '');
  const len = memory.trim().length;
  const valid = len >= 100 && len <= 300;

  if (variant === 'prompt') {
    return (
      <div className='rounded-2xl border border-[#e8dfd0] bg-[#fbf8f3] p-5'>
        <p className='text-sm font-semibold text-[#1a1a1a]'>Bloom Memoryを書きませんか？</p>
        <p className='mt-1 text-xs leading-6 text-[#6b6b6b]'>
          「{eventTitle}」で印象に残ったことを、あなただけの記録として残せます（100〜300文字）。
        </p>
        <form action={saveBloomMemoryAction} className='mt-4 space-y-3'>
          <input type='hidden' name='eventId' value={eventId} />
          <input type='hidden' name='returnTo' value={returnTo} />
          <textarea
            name='memory'
            value={memory}
            onChange={(e) => setMemory(e.target.value)}
            rows={4}
            placeholder='今日は花屋さんと話せた。普段知らない世界の話を聞けて面白かった。'
            className='w-full rounded-xl border border-[#e7e2d8] bg-white px-3 py-2 text-sm leading-6 text-[#3a3a3a] outline-none focus:border-[#1f5d4f]'
          />
          <p className={`text-xs ${valid ? 'text-[#1f5d4f]' : 'text-[#9a9a9a]'}`}>{len} / 100〜300文字</p>
          <div className='flex flex-wrap items-center gap-3'>
            <label className='flex items-center gap-2 text-xs text-[#6b6b6b]'>
              <input type='radio' name='visibility' value='private' defaultChecked={existing?.visibility !== 'public'} />
              非公開（自分だけ）
            </label>
            <label className='flex items-center gap-2 text-xs text-[#6b6b6b]'>
              <input type='radio' name='visibility' value='public' defaultChecked={existing?.visibility === 'public'} />
              公開
            </label>
          </div>
          <div className='flex flex-wrap gap-2'>
            <button
              type='submit'
              disabled={!valid}
              className='h-10 rounded-full bg-[#1f5d4f] px-5 text-xs font-semibold text-white disabled:opacity-40'
            >
              保存する
            </button>
            <button
              type='submit'
              formAction={skipBloomMemoryPromptAction}
              className='h-10 rounded-full border border-[#d8d6d1] px-5 text-xs font-medium text-[#6b6b6b]'
            >
              スキップ
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <form action={saveBloomMemoryAction} className='space-y-3 rounded-xl border border-[#f1efe9] bg-[#fafaf8] p-4'>
      <input type='hidden' name='eventId' value={eventId} />
      <input type='hidden' name='returnTo' value={returnTo} />
      <p className='text-xs font-semibold text-[#4a4a4a]'>{eventTitle}</p>
      <textarea
        name='memory'
        value={memory}
        onChange={(e) => setMemory(e.target.value)}
        rows={3}
        className='w-full rounded-lg border border-[#e7e2d8] bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-[#1f5d4f]'
      />
      <p className={`text-xs ${valid ? 'text-[#1f5d4f]' : 'text-[#9a9a9a]'}`}>{len} / 100〜300文字</p>
      <div className='flex flex-wrap gap-3 text-xs text-[#6b6b6b]'>
        <label className='flex items-center gap-1.5'>
          <input type='radio' name='visibility' value='private' defaultChecked={existing?.visibility !== 'public'} />
          非公開
        </label>
        <label className='flex items-center gap-1.5'>
          <input type='radio' name='visibility' value='public' defaultChecked={existing?.visibility === 'public'} />
          公開
        </label>
      </div>
      <button
        type='submit'
        disabled={!valid}
        className='rounded-full border border-[#1f5d4f] px-4 py-2 text-xs font-semibold text-[#1f5d4f] disabled:opacity-40'
      >
        {existing ? '更新する' : '保存する'}
      </button>
    </form>
  );
}

type ListProps = {
  memories: BloomMemory[];
  mode: 'owner' | 'public' | 'admin';
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function BloomMemoriesList({ memories, mode }: ListProps) {
  if (memories.length === 0) {
    return (
      <p className='text-sm text-[#c4c0b8]'>
        {mode === 'owner' ? 'イベント参加後に、印象に残ったことを記録できます。' : null}
        {mode === 'admin' ? 'Memory はまだありません' : null}
      </p>
    );
  }

  return (
    <div className='space-y-3'>
      {memories.map((m) => (
        <div key={m.id} className='rounded-xl border border-[#f1efe9] bg-[#fafaf8] px-4 py-3'>
          <div className='flex items-center justify-between gap-2'>
            <p className='text-xs font-semibold text-[#4a4a4a]'>{m.eventTitle ?? 'Connection'}</p>
            <p className='text-[10px] text-[#9a9a9a]'>{formatDate(m.createdAt)}</p>
          </div>
          <p className='mt-2 text-sm leading-7 text-[#3a3a3a]'>{m.memory}</p>
          {mode === 'owner' && m.visibility === 'private' ? (
            <p className='mt-1 text-[10px] text-[#9a9a9a]'>非公開</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
