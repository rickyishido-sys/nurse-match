'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { createConnectionEventAction } from '@/lib/connection/actions';

type CategoryOption = { value: string; label: string; emoji: string };

const ACCENT = '#1f5d4f';

const labelClass = 'mb-2 block text-sm font-semibold text-[#1a1a1a]';
const fieldClass =
  'w-full rounded-2xl border border-[#ddd9d1] bg-white px-4 py-3 text-sm text-[#1a1a1a] outline-none transition focus:border-[#1f5d4f] focus:ring-2 focus:ring-[#1f5d4f]/15';
const helpClass = 'mt-1.5 text-xs text-[#9a9a9a]';

export function CreateEventForm({ categories }: { categories: CategoryOption[] }) {
  const [category, setCategory] = useState<string>(categories[0]?.value ?? 'flower');
  const [approvalMode, setApprovalMode] = useState<'host_approval' | 'auto'>('host_approval');
  const [description, setDescription] = useState('');

  return (
    <form action={createConnectionEventAction} className='space-y-7'>
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
          <label htmlFor='coverUrl' className={labelClass}>
            カバー画像URL <span className='font-normal text-[#9a9a9a]'>（任意）</span>
          </label>
          <input id='coverUrl' name='coverUrl' type='url' placeholder='https://…' className={fieldClass} />
          <p className={helpClass}>未入力の場合、カテゴリーの世界観カラーが表示されます。</p>
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

      <motion.button
        type='submit'
        whileTap={{ scale: 0.98 }}
        className='w-full rounded-full py-4 text-sm font-semibold text-white shadow-sm'
        style={{ backgroundColor: ACCENT }}
      >
        この内容でイベントを公開する
      </motion.button>
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
