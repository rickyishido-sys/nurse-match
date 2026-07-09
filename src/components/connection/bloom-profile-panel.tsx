'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateBloomVisibilityAction } from '@/lib/connection/bloom-profile-actions';
import {
  BLOOM_VISIBILITY_NOTE,
  BLOOM_VISIBILITY_OPTIONS,
} from '@/lib/connection/bloom-ui-labels';
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
            : 'プロフィール紹介の更新に失敗しました',
        );
        return;
      }
      router.refresh();
    } catch {
      setError('プロフィール紹介の更新に失敗しました');
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
        {loading ? '生成中…' : hasProfile ? 'プロフィール紹介を更新する' : 'プロフィール紹介を生成する'}
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

const VISIBILITY_FIELD_MAP: Record<(typeof BLOOM_VISIBILITY_OPTIONS)[number]['name'], keyof BloomProfile> = {
  showBloomSummary: 'showBloomSummary',
  showAiIntro: 'showAiIntro',
  showConversationStarters: 'showConversationStarters',
  showBloomTags: 'showBloomTags',
  showConnectionStyle: 'showConnectionStyle',
};

export function BloomVisibilityForm({ profile }: VisibilityFormProps) {
  return (
    <form action={updateBloomVisibilityAction} className='space-y-3 rounded-2xl border border-[#ebe9e4] bg-[#fafaf8] p-4'>
      <div className='space-y-1'>
        <p className='text-xs font-semibold text-[#4a4a4a]'>公開設定</p>
        <p className='text-[11px] leading-5 text-[#6b6b6b]'>{BLOOM_VISIBILITY_NOTE}</p>
      </div>
      {BLOOM_VISIBILITY_OPTIONS.map((option) => (
        <label key={option.name} className='flex items-start gap-2 text-xs leading-5 text-[#6b6b6b]'>
          <input
            type='checkbox'
            name={option.name}
            value='1'
            defaultChecked={Boolean(profile[VISIBILITY_FIELD_MAP[option.name]])}
            className='mt-0.5 rounded'
          />
          <span>{option.label}</span>
        </label>
      ))}
      <button type='submit' className='mt-2 rounded-full border border-[#d8d6d1] px-4 py-2 text-xs font-medium text-[#4a4a4a]'>
        公開設定を保存
      </button>
    </form>
  );
}
