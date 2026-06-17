'use client';

import { saveProfileAction } from '@/lib/connection/actions';
import { MOTIVATION_OPTIONS } from '@/lib/connection/data';

type ProfileFormProps = {
  error?: string;
};

export function ConnectionProfileForm({ error }: ProfileFormProps) {
  return (
    <form action={saveProfileAction} className='space-y-5'>
      {error === 'nickname' ? (
        <p className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>ニックネームを入力してください。</p>
      ) : null}

      <label className='grid gap-1.5 text-sm'>
        <span className='font-medium text-[#1a1a1a]'>ニックネーム</span>
        <input name='nickname' required className='rounded-xl border border-[#d8d6d1] bg-white px-3 py-2.5' placeholder='例: あやか' />
      </label>

      <label className='grid gap-1.5 text-sm'>
        <span className='font-medium text-[#1a1a1a]'>年齢</span>
        <input name='age' type='number' min={18} max={99} required className='rounded-xl border border-[#d8d6d1] bg-white px-3 py-2.5' placeholder='32' />
      </label>

      <label className='grid gap-1.5 text-sm'>
        <span className='font-medium text-[#1a1a1a]'>性別</span>
        <select name='gender' required className='rounded-xl border border-[#d8d6d1] bg-white px-3 py-2.5'>
          <option value='female'>女性</option>
          <option value='male'>男性</option>
          <option value='other'>その他</option>
        </select>
      </label>

      <label className='grid gap-1.5 text-sm'>
        <span className='font-medium text-[#1a1a1a]'>居住地</span>
        <input name='area' required className='rounded-xl border border-[#d8d6d1] bg-white px-3 py-2.5' placeholder='例: 東京・渋谷' />
      </label>

      <label className='grid gap-1.5 text-sm'>
        <span className='font-medium text-[#1a1a1a]'>職業</span>
        <input name='occupation' required className='rounded-xl border border-[#d8d6d1] bg-white px-3 py-2.5' placeholder='例: デザイナー' />
      </label>

      <label className='grid gap-1.5 text-sm'>
        <span className='font-medium text-[#1a1a1a]'>自己紹介</span>
        <textarea name='bio' rows={4} required className='rounded-xl border border-[#d8d6d1] bg-white px-3 py-2.5' placeholder='あなたについて教えてください' />
      </label>

      <label className='grid gap-1.5 text-sm'>
        <span className='font-medium text-[#1a1a1a]'>プロフィール画像</span>
        <input type='file' name='avatar' accept='image/*' className='rounded-xl border border-[#d8d6d1] bg-white px-3 py-2 text-xs' />
        <span className='text-[11px] text-[#9a9a9a]'>MVPでは画像アップロードはモックです。</span>
      </label>

      <fieldset className='space-y-2'>
        <legend className='text-sm font-medium text-[#1a1a1a]'>あなたが求めるConnection（複数選択可）</legend>
        <div className='space-y-2'>
          {MOTIVATION_OPTIONS.map(([value, label]) => (
            <label key={value} className='flex items-center gap-2 rounded-xl border border-[#ebe9e4] bg-white px-3 py-2.5 text-sm'>
              <input type='checkbox' name='motivations' value={value} className='rounded' />
              <span className='text-[#4a4a4a]'>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <button type='submit' className='h-12 w-full rounded-full bg-[#1a1a1a] text-sm font-semibold text-white'>
        プロフィールを登録する
      </button>
    </form>
  );
}
