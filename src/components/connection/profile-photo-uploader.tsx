'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MemberProfilePhoto } from '@/lib/connection/types';

const GOLD = '#b8956a';
const ACCENT = '#1f5d4f';
const MAX_PHOTOS = 6;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif';
const MAX_BYTES = 12 * 1024 * 1024;

type Slot =
  | { kind: 'existing'; id: string; url: string }
  | { kind: 'new'; file: File; url: string };

function syncFiles(input: HTMLInputElement | null, slots: Slot[]) {
  if (!input) return;
  const dt = new DataTransfer();
  slots.filter((s): s is Extract<Slot, { kind: 'new' }> => s.kind === 'new').forEach((s) => dt.items.add(s.file));
  input.files = dt.files;
}

function buildManifest(slots: Slot[]): string {
  let fileIndex = 0;
  const manifest = slots.map((s) =>
    s.kind === 'existing' ? { type: 'existing' as const, id: s.id } : { type: 'new' as const, fileIndex: fileIndex++ },
  );
  return JSON.stringify(manifest);
}

export function ProfilePhotoUploader({ initialPhotos = [] }: { initialPhotos?: MemberProfilePhoto[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<Slot[]>(() =>
    [...initialPhotos]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({ kind: 'existing' as const, id: p.id, url: p.url })),
  );
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const updateSlots = useCallback((next: Slot[]) => {
    setSlots(next);
    syncFiles(fileInputRef.current, next);
  }, []);

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return;
      let err = '';
      const accepted: Slot[] = [];
      for (const file of Array.from(fileList)) {
        if (!file.type.startsWith('image/')) {
          err = '画像ファイルを選択してください。';
          continue;
        }
        if (file.size > MAX_BYTES) {
          err = '1枚あたり12MBまでアップロードできます。';
          continue;
        }
        accepted.push({ kind: 'new', file, url: URL.createObjectURL(file) });
      }
      setSlots((prev) => {
        const room = MAX_PHOTOS - prev.length;
        if (accepted.length > room) err = `プロフィール写真は最大${MAX_PHOTOS}枚までです。`;
        const next = [...prev, ...accepted.slice(0, Math.max(0, room))];
        syncFiles(fileInputRef.current, next);
        return next;
      });
      setError(err);
    },
    [],
  );

  const removeAt = (index: number) => {
    setSlots((prev) => {
      const target = prev[index];
      if (target?.kind === 'new') URL.revokeObjectURL(target.url);
      const next = prev.filter((_, i) => i !== index);
      syncFiles(fileInputRef.current, next);
      return next;
    });
    setError('');
  };

  const move = (index: number, dir: -1 | 1) => {
    setSlots((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      syncFiles(fileInputRef.current, next);
      return next;
    });
  };

  useEffect(() => {
    return () => {
      slots.forEach((s) => {
        if (s.kind === 'new') URL.revokeObjectURL(s.url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className='space-y-3'>
      <input type='hidden' name='photoManifest' value={buildManifest(slots)} readOnly />
      <input
        ref={fileInputRef}
        type='file'
        name='profileImages'
        accept={ACCEPT}
        multiple
        className='hidden'
        onChange={(e) => addFiles(e.target.files)}
      />

      <div
        role='button'
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        onClick={() => slots.length < MAX_PHOTOS && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`rounded-2xl border border-dashed px-4 py-6 text-center transition ${
          dragOver ? 'border-[#1f5d4f] bg-[#f3f7f5]' : 'border-[#d8cdbb] bg-[#faf7f1]'
        } ${slots.length >= MAX_PHOTOS ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
      >
        <p className='text-xs leading-6 text-[#7a7264]'>
          タップまたはドラッグ＆ドロップで追加。
          <br />
          1枚目がメインプロフィールになります。
        </p>
        <span
          className='mt-3 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white'
          style={{ backgroundColor: ACCENT }}
        >
          ＋ 写真を追加する
        </span>
        <p className='mt-2 text-[11px] text-[#9a9a9a]'>
          最大{MAX_PHOTOS}枚 · 自動でWebP圧縮 · {slots.length}/{MAX_PHOTOS}
        </p>
      </div>

      {slots.length > 0 ? (
        <div className='-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
          {slots.map((slot, index) => (
            <div key={slot.kind === 'existing' ? slot.id : slot.url} className='relative shrink-0'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slot.url}
                alt={`プロフィール写真 ${index + 1}`}
                className='h-28 w-28 rounded-2xl border border-[#e7e2d8] object-cover'
              />
              {index === 0 ? (
                <span
                  className='absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white'
                  style={{ backgroundColor: GOLD }}
                >
                  メイン
                </span>
              ) : null}
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(index);
                }}
                aria-label='写真を削除'
                className='absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-sm leading-none text-white'
              >
                ×
              </button>
              <div className='absolute inset-x-1.5 bottom-1.5 flex justify-between'>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    move(index, -1);
                  }}
                  disabled={index === 0}
                  aria-label='前へ'
                  className='flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-xs disabled:opacity-30'
                >
                  ‹
                </button>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    move(index, 1);
                  }}
                  disabled={index === slots.length - 1}
                  aria-label='次へ'
                  className='flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-xs disabled:opacity-30'
                >
                  ›
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className='text-xs text-[#c0526b]'>{error}</p> : null}
    </div>
  );
}
