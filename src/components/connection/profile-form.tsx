'use client';

import Link from 'next/link';
import { saveProfileAction } from '@/lib/connection/actions';
import {
  INTEREST_TAG_OPTIONS,
  LIFE_PHASE_OPTIONS,
  PERSONALITY_TYPE_META,
  PURPOSE_OPTIONS,
} from '@/lib/connection/data';
import type { ConnectionMember } from '@/lib/connection/types';

type ProfileFormProps = {
  error?: string;
  member?: ConnectionMember | null;
};

const inputClass = 'rounded-xl border border-[#d8d6d1] bg-white px-3 py-2.5 text-sm';
const labelClass = 'font-medium text-[#1a1a1a]';

export function ConnectionProfileForm({ error, member }: ProfileFormProps) {
  const v = member?.values;

  return (
    <form action={saveProfileAction} className='space-y-8'>
      {error === 'nickname' ? (
        <p className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>ニックネームを入力してください。</p>
      ) : null}

      {/* 基本情報 */}
      <section className='space-y-4'>
        <h2 className='text-sm font-semibold text-[#1a1a1a]'>基本情報</h2>

        <label className='grid gap-1.5 text-sm'>
          <span className={labelClass}>ニックネーム</span>
          <input name='nickname' required defaultValue={member?.nickname} className={inputClass} placeholder='例: あやか' />
        </label>

        <label className='grid gap-1.5 text-sm'>
          <span className={labelClass}>年齢</span>
          <input name='age' type='number' min={18} max={99} required defaultValue={member?.age} className={inputClass} placeholder='32' />
        </label>

        <label className='grid gap-1.5 text-sm'>
          <span className={labelClass}>性別</span>
          <select name='gender' required defaultValue={member?.gender ?? 'female'} className={inputClass}>
            <option value='female'>女性</option>
            <option value='male'>男性</option>
            <option value='other'>その他</option>
          </select>
        </label>

        <label className='grid gap-1.5 text-sm'>
          <span className={labelClass}>居住地</span>
          <input name='area' required defaultValue={member?.area} className={inputClass} placeholder='例: 東京・渋谷' />
        </label>

        <label className='grid gap-1.5 text-sm'>
          <span className={labelClass}>職業</span>
          <input name='occupation' required defaultValue={member?.occupation} className={inputClass} placeholder='例: デザイナー' />
        </label>

        <label className='grid gap-1.5 text-sm'>
          <span className={labelClass}>自己紹介</span>
          <textarea name='bio' rows={3} required defaultValue={member?.bio} className={inputClass} placeholder='あなたについて教えてください' />
        </label>

        <label className='grid gap-1.5 text-sm'>
          <span className={labelClass}>プロフィール画像</span>
          <input type='file' name='avatar' accept='image/*' className='rounded-xl border border-[#d8d6d1] bg-white px-3 py-2 text-xs' />
          <span className='text-[11px] text-[#9a9a9a]'>MVPでは画像アップロードはモックです。</span>
        </label>
      </section>

      {/* 価値観・人生観 */}
      <section className='space-y-4 border-t border-[#ebe9e4] pt-6'>
        <div>
          <h2 className='text-sm font-semibold text-[#1a1a1a]'>価値観・人生観</h2>
          <p className='mt-1 text-xs leading-5 text-[#6b6b6b]'>属性だけでは見えない、あなたの人柄を教えてください。</p>
        </div>

        <label className='grid gap-1.5 text-sm'>
          <span className={labelClass}>あなたが今一番大切にしていること</span>
          <textarea name='mostImportant' rows={2} defaultValue={v?.mostImportant} className={inputClass} placeholder='例: 大切な人との時間' />
        </label>

        <label className='grid gap-1.5 text-sm'>
          <span className={labelClass}>最近挑戦していること</span>
          <textarea name='currentChallenge' rows={2} defaultValue={v?.currentChallenge} className={inputClass} />
        </label>

        <label className='grid gap-1.5 text-sm'>
          <span className={labelClass}>今後やってみたいこと</span>
          <textarea name='futureGoal' rows={2} defaultValue={v?.futureGoal} className={inputClass} />
        </label>

        <label className='grid gap-1.5 text-sm'>
          <span className={labelClass}>最近感動したこと</span>
          <textarea name='recentInspiration' rows={2} defaultValue={v?.recentInspiration} className={inputClass} />
        </label>

        <label className='grid gap-1.5 text-sm'>
          <span className={labelClass}>人からどんな人だと言われますか？</span>
          <input name='howOthersSeeMe' defaultValue={v?.howOthersSeeMe} className={inputClass} />
        </label>

        <label className='grid gap-1.5 text-sm'>
          <span className={labelClass}>自分の性格を一言で表すと？</span>
          <input name='personalityOneWord' defaultValue={v?.personalityOneWord} className={inputClass} />
        </label>

        <label className='grid gap-1.5 text-sm'>
          <span className={labelClass}>あなたが大切にしている価値観</span>
          <textarea name='coreValues' rows={2} defaultValue={v?.coreValues} className={inputClass} />
        </label>
      </section>

      {/* Connection目的 */}
      <fieldset className='space-y-2 border-t border-[#ebe9e4] pt-6'>
        <legend className='text-sm font-semibold text-[#1a1a1a]'>Connection目的（複数選択可）</legend>
        <div className='mt-3 space-y-2'>
          {PURPOSE_OPTIONS.map(([value, label]) => (
            <label key={value} className='flex items-center gap-2 rounded-xl border border-[#ebe9e4] bg-white px-3 py-2.5 text-sm'>
              <input type='checkbox' name='purposes' value={value} defaultChecked={member?.purposes.includes(value)} className='rounded' />
              <span className='text-[#4a4a4a]'>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 興味関心 */}
      <fieldset className='space-y-2 border-t border-[#ebe9e4] pt-6'>
        <legend className='text-sm font-semibold text-[#1a1a1a]'>興味関心タグ（複数選択可）</legend>
        <div className='mt-3 grid grid-cols-2 gap-2'>
          {INTEREST_TAG_OPTIONS.map(([value, label]) => (
            <label key={value} className='flex items-center gap-2 rounded-xl border border-[#ebe9e4] bg-white px-3 py-2 text-sm'>
              <input type='checkbox' name='interestTags' value={value} defaultChecked={member?.interestTags.includes(value)} className='rounded' />
              <span className='text-[#4a4a4a]'>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 人生フェーズ */}
      <fieldset className='space-y-2 border-t border-[#ebe9e4] pt-6'>
        <legend className='text-sm font-semibold text-[#1a1a1a]'>人生フェーズ</legend>
        <div className='mt-3 space-y-2'>
          {LIFE_PHASE_OPTIONS.map(([value, label]) => (
            <label key={value} className='flex items-center gap-2 rounded-xl border border-[#ebe9e4] bg-white px-3 py-2.5 text-sm'>
              <input type='radio' name='lifePhase' value={value} required defaultChecked={member?.lifePhase === value} />
              <span className='text-[#4a4a4a]'>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 性格診断 */}
      <section className='rounded-2xl border border-[#ebe9e4] bg-[#f5f4f2] p-4'>
        <h2 className='text-sm font-semibold text-[#1a1a1a]'>性格診断（推奨）</h2>
        <p className='mt-1 text-xs leading-5 text-[#6b6b6b]'>
          6問の簡易診断で性格タイプを判定。将来のグルーピングに活用します。
        </p>
        {member?.personality ? (
          <p className='mt-2 text-xs font-medium text-[#1a1a1a]'>
            現在: {PERSONALITY_TYPE_META[member.personality.type].label} タイプ
          </p>
        ) : null}
        <Link
          href='/register/profile/personality'
          className='mt-3 inline-flex h-10 items-center justify-center rounded-full border border-[#1a1a1a] px-4 text-xs font-semibold text-[#1a1a1a]'
        >
          性格診断を受ける
        </Link>
      </section>

      <button type='submit' className='h-12 w-full rounded-full bg-[#1a1a1a] text-sm font-semibold text-white'>
        プロフィールを登録する
      </button>
    </form>
  );
}
