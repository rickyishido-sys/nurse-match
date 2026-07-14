'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cancelEventAction, deleteEventAction, updateEventAction } from '@/lib/connection/v1-actions';
import { EVENT_CATEGORY_CREATE_ORDER, EVENT_CATEGORY_META } from '@/lib/connection/data';

const fieldClass =
  'min-h-[44px] w-full rounded-2xl border border-[#ddd9d1] bg-white px-4 py-3 text-sm text-[#1a1a1a] outline-none focus:border-[#1f5d4f] focus:ring-2 focus:ring-[#1f5d4f]/15';

type EditEventFormProps = {
  event: {
    id: string;
    title: string;
    category: string;
    description: string;
    startAt: string;
    area: string;
    venue: string;
    capacity: number;
    fee: number;
    conditions: string;
    approvalMode: string;
    recruitmentType: string;
    status: string;
    imageUrls: string[];
  };
  error?: string;
};

export function EditEventForm({ event, error }: EditEventFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const localStart = event.startAt ? new Date(event.startAt).toISOString().slice(0, 16) : '';

  return (
    <div className='space-y-8'>
      {error ? (
        <p className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700'>{decodeURIComponent(error)}</p>
      ) : null}

      <form
        action={async (fd) => {
          setSubmitting(true);
          try {
            await updateEventAction(fd);
          } finally {
            setSubmitting(false);
          }
        }}
        className='space-y-5'
      >
        <input type='hidden' name='eventId' value={event.id} />
        <input type='hidden' name='imageUrls' value={event.imageUrls.join(',')} />

        <label className='block'>
          <span className='mb-2 block text-sm font-semibold'>タイトル</span>
          <input name='title' defaultValue={event.title} required className={fieldClass} />
        </label>

        <label className='block'>
          <span className='mb-2 block text-sm font-semibold'>カテゴリ</span>
          <select name='category' defaultValue={event.category} className={fieldClass}>
            {EVENT_CATEGORY_CREATE_ORDER.map((id) => {
              const meta = EVENT_CATEGORY_META[id];
              return (
                <option key={id} value={id}>{meta.label}</option>
              );
            })}
          </select>
        </label>

        <label className='block'>
          <span className='mb-2 block text-sm font-semibold'>説明</span>
          <textarea name='description' defaultValue={event.description} rows={5} className={`${fieldClass} min-h-[120px]`} />
        </label>

        <label className='block'>
          <span className='mb-2 block text-sm font-semibold'>開催日時</span>
          <input type='datetime-local' name='startAt' defaultValue={localStart} required className={fieldClass} />
        </label>

        <label className='block'>
          <span className='mb-2 block text-sm font-semibold'>エリア</span>
          <input name='area' defaultValue={event.area} required className={fieldClass} />
        </label>

        <label className='block'>
          <span className='mb-2 block text-sm font-semibold'>会場</span>
          <input name='venue' defaultValue={event.venue} className={fieldClass} />
        </label>

        <div className='grid gap-4 sm:grid-cols-2'>
          <label className='block'>
            <span className='mb-2 block text-sm font-semibold'>定員</span>
            <input type='number' name='capacity' min={2} max={50} defaultValue={event.capacity} className={fieldClass} />
          </label>
          <label className='block'>
            <span className='mb-2 block text-sm font-semibold'>参加費（円）</span>
            <input type='number' name='fee' min={0} defaultValue={event.fee} className={fieldClass} />
          </label>
        </div>

        <label className='block'>
          <span className='mb-2 block text-sm font-semibold'>参加条件</span>
          <textarea name='conditions' defaultValue={event.conditions} rows={3} className={fieldClass} />
        </label>

        <label className='block'>
          <span className='mb-2 block text-sm font-semibold'>承認方式</span>
          <select name='approvalMode' defaultValue={event.approvalMode} className={fieldClass}>
            <option value='host_approval'>主催者承認</option>
            <option value='auto'>自動承認</option>
          </select>
        </label>

        <label className='block'>
          <span className='mb-2 block text-sm font-semibold'>募集種別</span>
          <select name='recruitmentType' defaultValue={event.recruitmentType} className={fieldClass}>
            <option value='standard'>通常募集</option>
            <option value='additional'>追加募集</option>
          </select>
        </label>

        <label className='flex min-h-[44px] items-center gap-3'>
          <input type='checkbox' name='isPublic' value='1' defaultChecked={event.status !== 'closed'} className='h-5 w-5' />
          <span className='text-sm'>イベントを公開する</span>
        </label>

        <button type='submit' disabled={submitting} className='min-h-[44px] w-full rounded-full bg-[#1f5d4f] text-sm font-semibold text-white disabled:opacity-60'>
          {submitting ? '保存中…' : '変更を保存'}
        </button>
      </form>

      <section className='space-y-3 rounded-2xl border border-rose-100 bg-rose-50/40 p-4'>
        <h2 className='text-sm font-semibold text-rose-800'>イベントの中止・削除</h2>
        <p className='text-xs leading-6 text-[#6b6b6b]'>参加者がいる場合は中止（履歴保持）となります。申請がない場合のみ削除できます。</p>
        <form
          action={async (fd) => {
            if (!confirm('このイベントを中止しますか？')) return;
            await cancelEventAction(fd);
          }}
          className='space-y-2'
        >
          <input type='hidden' name='eventId' value={event.id} />
          <textarea name='reason' required rows={2} placeholder='中止理由' className={fieldClass} />
          <button type='submit' className='min-h-[44px] w-full rounded-full border border-rose-300 text-sm font-semibold text-rose-700'>
            イベントを中止する
          </button>
        </form>
        <form
          action={async (fd) => {
            if (!confirm('このイベントを削除しますか？元に戻せません。')) return;
            await deleteEventAction(fd);
          }}
        >
          <input type='hidden' name='eventId' value={event.id} />
          <button type='submit' className='min-h-[44px] w-full rounded-full border border-[#d8d6d1] text-sm font-semibold text-[#6b6b6b]'>
            イベントを削除する
          </button>
        </form>
      </section>

      <Link href={`/events/${event.id}`} className='block text-center text-sm text-[#6b6b6b] underline-offset-2 hover:underline'>
        イベント詳細に戻る
      </Link>
    </div>
  );
}
