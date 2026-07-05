'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { uploadEventImagesClient } from '@/lib/connection/upload-event-images-client';

type CategoryOption = { value: string; label: string; emoji: string };

const ACCENT = '#1f5d4f';
const GOLD = '#b8956a';
const MAX_IMAGES = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const labelClass = 'mb-2 block text-sm font-semibold text-[#1a1a1a]';
const fieldClass =
  'w-full rounded-2xl border border-[#ddd9d1] bg-white px-4 py-3 text-sm text-[#1a1a1a] outline-none transition focus:border-[#1f5d4f] focus:ring-2 focus:ring-[#1f5d4f]/15';
const helpClass = 'mt-1.5 text-xs text-[#9a9a9a]';

export function CreateEventForm({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [category, setCategory] = useState<string>(categories[0]?.value ?? 'flower');
  const [approvalMode, setApprovalMode] = useState<'host_approval' | 'auto'>('host_approval');
  const [description, setDescription] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const [imageError, setImageError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      const form = e.currentTarget;
      const fd = new FormData(form);
      const files = images.map((item) => item.file);
      const imageUrls = files.length > 0 ? await uploadEventImagesClient(files) : [];

      const payload = {
        title: String(fd.get('title') ?? '').trim(),
        category: String(fd.get('category') ?? 'other'),
        description: String(fd.get('description') ?? '').trim(),
        startAt: String(fd.get('startAt') ?? '').trim(),
        area: String(fd.get('area') ?? '').trim(),
        venue: String(fd.get('venue') ?? '').trim(),
        capacity: Number(fd.get('capacity')) || 6,
        fee: Number(fd.get('fee')) || 0,
        conditions: String(fd.get('conditions') ?? '').trim(),
        approvalMode: String(fd.get('approvalMode') ?? 'host_approval'),
        imageUrls,
      };

      const res = await fetch('/api/hanakai/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data: { ok?: boolean; eventId?: string; error?: string; code?: string } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        setSubmitError('サーバーからの応答を読み取れませんでした。時間をおいて再度お試しください。');
        return;
      }

      if (!res.ok || !data.ok || !data.eventId) {
        if (data.code === 'UNAUTHORIZED') {
          router.push('/login?next=/events/create');
          return;
        }
        if (data.code === 'NO_MEMBER') {
          router.push('/register/profile');
          return;
        }
        setSubmitError(data.error ?? 'イベントの公開に失敗しました。入力内容を確認して再度お試しください。');
        return;
      }

      router.push(`/events/${data.eventId}?created=1`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'イベントの公開に失敗しました。';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    let err = '';
    const accepted: { file: File; url: string }[] = [];
    for (const file of Array.from(fileList)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        err = 'jpg / png / webp の画像を選択してください。';
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        err = '1枚あたり10MBまでアップロードできます。';
        continue;
      }
      accepted.push({ file, url: URL.createObjectURL(file) });
    }
    setImages((prev) => {
      const room = MAX_IMAGES - prev.length;
      if (accepted.length > room) err = `写真は最大${MAX_IMAGES}枚までです。`;
      return [...prev, ...accepted.slice(0, Math.max(0, room))];
    });
    setImageError(err);
  }

  function removeAt(index: number) {
    setImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
    setImageError('');
  }

  function move(index: number, dir: -1 | 1) {
    setImages((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  useEffect(() => {
    return () => {
      images.forEach((item) => URL.revokeObjectURL(item.url));
    };
    // unmount 時のみクリーンアップ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form onSubmit={handleSubmit} className='space-y-7'>
      <input type='hidden' name='category' value={category} />
      <input type='hidden' name='approvalMode' value={approvalMode} />

      {/* 基本情報 */}
      <section className='space-y-5'>
        <div>
          <label htmlFor='title' className={labelClass}>
            イベント名
          </label>
          <input
            id='title'
            name='title'
            required
            maxLength={60}
            placeholder='例：朝の花あしらいと珈琲'
            className={fieldClass}
          />
        </div>

        <div>
          <span className={labelClass}>カテゴリー</span>
          <div className='flex flex-wrap gap-2'>
            {categories.map((cat) => {
              const active = category === cat.value;
              return (
                <button
                  key={cat.value}
                  type='button'
                  onClick={() => setCategory(cat.value)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition active:scale-[0.97] ${
                    active
                      ? 'border-transparent bg-[#1f5d4f] text-white'
                      : 'border-[#ddd9d1] bg-white text-[#6b6b6b]'
                  }`}
                >
                  <span aria-hidden>{cat.emoji}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor='description' className={labelClass}>
            イベント説明
          </label>
          <textarea
            id='description'
            name='description'
            rows={5}
            maxLength={600}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='どんな時間を過ごしたいか、どんな方に来てほしいかを、あなたの言葉で書いてみてください。'
            className={`${fieldClass} resize-none leading-7`}
          />
          <p className={helpClass}>{description.length} / 600文字</p>
        </div>
      </section>

      <div className='h-px bg-[#ebe9e4]' />

      {/* 開催情報 */}
      <section className='space-y-5'>
        <div>
          <label htmlFor='startAt' className={labelClass}>
            開催日時
          </label>
          <input id='startAt' name='startAt' type='datetime-local' required className={fieldClass} />
        </div>

        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
          <div>
            <label htmlFor='area' className={labelClass}>
              エリア
            </label>
            <input id='area' name='area' required placeholder='例：東京・南青山' className={fieldClass} />
          </div>
          <div>
            <label htmlFor='venue' className={labelClass}>
              会場名
            </label>
            <input id='venue' name='venue' placeholder='例：アトリエ&カフェ AOYAMA' className={fieldClass} />
          </div>
        </div>

        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
          <div>
            <label htmlFor='capacity' className={labelClass}>
              定員
            </label>
            <input
              id='capacity'
              name='capacity'
              type='number'
              min={2}
              max={50}
              defaultValue={6}
              className={fieldClass}
            />
            <p className={helpClass}>少人数ほど、深いConnectionが生まれます。</p>
          </div>
          <div>
            <label htmlFor='fee' className={labelClass}>
              参加費（円）
            </label>
            <input
              id='fee'
              name='fee'
              type='number'
              min={0}
              step={100}
              defaultValue={0}
              className={fieldClass}
            />
            <p className={helpClass}>0 で無料になります。</p>
          </div>
        </div>

        <div>
          <label htmlFor='conditions' className={labelClass}>
            参加条件 <span className='font-normal text-[#9a9a9a]'>（任意）</span>
          </label>
          <input
            id='conditions'
            name='conditions'
            maxLength={80}
            placeholder='例：初参加歓迎・一人参加OK'
            className={fieldClass}
          />
        </div>

        <div>
          <span className={labelClass}>
            イベント写真 <span className='font-normal text-[#9a9a9a]'>（任意・最大{MAX_IMAGES}枚）</span>
          </span>

          {/* 送信用の隠しファイル入力。並び替え・削除は state → files へ同期。 */}
          <input
            ref={fileInputRef}
            type='file'
            accept='image/jpeg,image/png,image/webp'
            multiple
            className='hidden'
            onChange={(e) => {
              addFiles(e.target.files);
            }}
          />

          {images.length === 0 ? (
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#d8cdbb] bg-[#faf7f1] px-4 py-9 text-center transition active:scale-[0.99]'
            >
              <p className='text-xs leading-6 text-[#7a7264]'>
                前回開催時の写真や、イベントの雰囲気が分かる写真を追加できます。
              </p>
              <span
                className='inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white'
                style={{ backgroundColor: ACCENT }}
              >
                <span className='text-base leading-none'>＋</span>
                写真を追加する
              </span>
            </button>
          ) : (
            <div className='-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
              {images.map((item, index) => (
                <div key={item.url} className='relative shrink-0'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={`イベント写真 ${index + 1}`}
                    className='h-28 w-28 rounded-2xl border border-[#e7e2d8] object-cover'
                  />
                  {index === 0 ? (
                    <span
                      className='absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white'
                      style={{ backgroundColor: GOLD }}
                    >
                      表紙
                    </span>
                  ) : null}
                  <button
                    type='button'
                    onClick={() => removeAt(index)}
                    aria-label='写真を削除'
                    className='absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-sm leading-none text-white backdrop-blur'
                  >
                    ×
                  </button>
                  <div className='absolute inset-x-1.5 bottom-1.5 flex justify-between'>
                    <button
                      type='button'
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label='前へ移動'
                      className='flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-xs text-[#1a1a1a] disabled:opacity-30'
                    >
                      ‹
                    </button>
                    <button
                      type='button'
                      onClick={() => move(index, 1)}
                      disabled={index === images.length - 1}
                      aria-label='次へ移動'
                      className='flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-xs text-[#1a1a1a] disabled:opacity-30'
                    >
                      ›
                    </button>
                  </div>
                </div>
              ))}

              {images.length < MAX_IMAGES ? (
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  className='flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[#d8cdbb] bg-[#faf7f1] text-[#1f5d4f] transition active:scale-[0.97]'
                >
                  <span className='text-xl leading-none'>＋</span>
                  <span className='text-[11px] font-medium'>追加</span>
                </button>
              ) : null}
            </div>
          )}

          {imageError ? (
            <p className='mt-2 text-xs text-[#c0526b]'>{imageError}</p>
          ) : (
            <p className={helpClass}>jpg / png / webp・1枚10MBまで。1枚目が一覧の表紙になります。</p>
          )}
        </div>
      </section>

      <div className='h-px bg-[#ebe9e4]' />

      {/* 承認方式 */}
      <section className='space-y-3'>
        <span className={labelClass}>参加の承認方式</span>
        <ApprovalOption
          active={approvalMode === 'host_approval'}
          onClick={() => setApprovalMode('host_approval')}
          title='主催者承認制'
          recommended
          description='申請してくれた方を、あなたが一人ずつ確認して承認します。安心・安全なつながりのための、おすすめの方式です。'
        />
        <ApprovalOption
          active={approvalMode === 'auto'}
          onClick={() => setApprovalMode('auto')}
          title='自動承認'
          description='申請した方が定員まで自動的に参加できます。気軽に集まりたいときに。'
        />
      </section>

      <button
        type='submit'
        disabled={submitting}
        className='w-full rounded-full py-4 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60'
        style={{ backgroundColor: ACCENT }}
      >
        {submitting ? '公開しています…' : 'この内容でイベントを公開する'}
      </button>
      {submitError ? (
        <p className='text-center text-xs text-[#c0526b]'>{submitError}</p>
      ) : null}
      <p className='text-center text-xs leading-6 text-[#9a9a9a]'>
        HANAKAIは「人を集める場」ではなく、
        <br />
        「最適なConnectionを設計する場」です。
      </p>
    </form>
  );
}

function ApprovalOption({
  active,
  onClick,
  title,
  description,
  recommended = false,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
  recommended?: boolean;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition active:scale-[0.99] ${
        active ? 'border-[#1f5d4f] bg-[#f3f7f5]' : 'border-[#ddd9d1] bg-white'
      }`}
    >
      <div className='flex items-start gap-3'>
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            active ? 'border-[#1f5d4f]' : 'border-[#c8c4bc]'
          }`}
          aria-hidden
        >
          {active ? <span className='h-2.5 w-2.5 rounded-full bg-[#1f5d4f]' /> : null}
        </span>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <p className='text-sm font-semibold text-[#1a1a1a]'>{title}</p>
            {recommended ? (
              <span className='rounded-full bg-[#1f5d4f] px-2 py-0.5 text-[10px] font-medium text-white'>
                デフォルト
              </span>
            ) : null}
          </div>
          <p className='text-xs leading-6 text-[#6b6b6b]'>{description}</p>
        </div>
      </div>
    </button>
  );
}
