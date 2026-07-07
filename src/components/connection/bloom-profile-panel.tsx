'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateBloomVisibilityAction } from '@/lib/connection/bloom-profile-actions';
import type { BloomProfile } from '@/lib/connection/bloom-profile-types';

type Props = {
  aiEnabled: boolean;
  hasProfile: boolean;
};

export function BloomProfileUpdateButton({ aiEnabled, hasProfile }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate() {
    if (!aiEnabled || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/hanakai/bloom/generate-profile', { method: 'POST' });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setError(
          payload.error === 'not_configured'
            ? 'AI機能は準備中です'
            : 'Bloom Profile の更新に失敗しました',
        );
        return;
      }
      router.refresh();
    } catch {
      setError('Bloom Profile の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='space-y-2'>
      <button
        type='button'
        disabled={!aiEnabled || loading}
        onClick={() => void handleUpdate()}
        className='h-11 w-full rounded-full bg-[#1f5d4f] text-sm font-semibold text-white transition enabled:hover:bg-[#1a4f44] disabled:cursor-not-allowed disabled:opacity-50'
      >
        {loading ? '生成中…' : hasProfile ? 'Bloom Profileを更新する' : 'Bloom Profileを生成する'}
      </button>
      {!aiEnabled ? (
        <p className='text-center text-xs text-[#9a9a9a]'>準備中（OpenAI未設定）</p>
      ) : null}
      {error ? <p className='text-center text-xs text-rose-600'>{error}</p> : null}
    </div>
  );
}

type VisibilityFormProps = {
  profile: BloomProfile;
};

export function BloomVisibilityForm({ profile }: VisibilityFormProps) {
  return (
    <form action={updateBloomVisibilityAction} className='space-y-2 rounded-2xl border border-[#ebe9e4] bg-[#fafaf8] p-4'>
      <p className='text-xs font-semibold text-[#4a4a4a]'>公開設定</p>
      <label className='flex items-center gap-2 text-xs text-[#6b6b6b]'>
        <input type='checkbox' name='showAiIntro' value='1' defaultChecked={profile.showAiIntro} className='rounded' />
        AI自己紹介を公開
      </label>
      <label className='flex items-center gap-2 text-xs text-[#6b6b6b]'>
        <input type='checkbox' name='showBloomSummary' value='1' defaultChecked={profile.showBloomSummary} className='rounded' />
        Bloom Summaryを公開
      </label>
      <label className='flex items-center gap-2 text-xs text-[#6b6b6b]'>
        <input
          type='checkbox'
          name='showConversationStarters'
          value='1'
          defaultChecked={profile.showConversationStarters}
          className='rounded'
        />
        Conversation Startersを公開
      </label>
      <label className='flex items-center gap-2 text-xs text-[#6b6b6b]'>
        <input type='checkbox' name='showBloomTags' value='1' defaultChecked={profile.showBloomTags} className='rounded' />
        Bloom Tagsを公開
      </label>
      <input type='hidden' name='showConnectionStyle' value='1' />
      <button type='submit' className='mt-2 rounded-full border border-[#d8d6d1] px-4 py-2 text-xs font-medium text-[#4a4a4a]'>
        公開設定を保存
      </button>
    </form>
  );
}
