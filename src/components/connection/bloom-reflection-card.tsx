'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  reflection: string;
  aiEnabled: boolean;
  mode: 'owner' | 'public' | 'admin';
};

export function BloomReflectionCard({ reflection, aiEnabled, mode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    if (!aiEnabled || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/hanakai/bloom/generate-reflection', { method: 'POST' });
      const payload = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !payload.ok) {
        setError('Reflection の更新に失敗しました');
        return;
      }
      router.refresh();
    } catch {
      setError('Reflection の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  if (!reflection.trim()) {
    return (
      <div className='space-y-2'>
        <p className='text-sm text-[#c4c0b8]'>
          {mode === 'owner'
            ? 'Bloom Memoryを記録すると、「最近のあなた」が育っていきます。'
            : null}
          {mode === 'admin' ? 'AI Reflection は未生成です' : null}
        </p>
        {mode === 'owner' ? (
          <button
            type='button'
            disabled={loading}
            onClick={() => void handleRefresh()}
            className='text-xs font-medium text-[#1f5d4f] underline-offset-2 hover:underline disabled:opacity-50'
          >
            {loading ? '更新中…' : 'Reflectionを試す'}
          </button>
        ) : null}
        {error ? <p className='text-xs text-rose-600'>{error}</p> : null}
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <p className='text-sm leading-8 text-[#3a3a3a]'>{reflection}</p>
      {mode === 'owner' ? (
        <div className='space-y-1'>
          <button
            type='button'
            disabled={!aiEnabled || loading}
            onClick={() => void handleRefresh()}
            className='text-xs font-medium text-[#1f5d4f] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50'
          >
            {loading ? '更新中…' : 'Reflectionを更新する'}
          </button>
          {!aiEnabled ? (
            <p className='text-[10px] text-[#9a9a9a]'>OpenAI未設定時はテンプレートで生成されます</p>
          ) : null}
          {error ? <p className='text-xs text-rose-600'>{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
