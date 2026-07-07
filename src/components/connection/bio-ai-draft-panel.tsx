'use client';

import { useState } from 'react';

type BioAiDraftPanelProps = {
  aiEnabled: boolean;
  bio: string;
  onBioChange: (value: string) => void;
  onAiAdopted: () => void;
};

export function BioAiDraftPanel({ aiEnabled, bio, onBioChange, onAiAdopted }: BioAiDraftPanelProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateDraft() {
    if (!aiEnabled || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/hanakai/bloom/generate-introduction', { method: 'POST' });
      const payload = (await response.json()) as { ok: boolean; introduction?: string; error?: string };
      if (!response.ok || !payload.ok || !payload.introduction) {
        setError(payload.error ?? 'AI下書きの生成に失敗しました');
        return;
      }
      setDraft(payload.introduction);
    } catch {
      setError('AI下書きの生成に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  function adoptDraft() {
    if (!draft) return;
    onBioChange(draft);
    onAiAdopted();
    setDraft(null);
    setError(null);
  }

  return (
    <div className='rounded-2xl border border-[#ebe9e4] bg-[#f7f6f2] px-4 py-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <p className='text-sm font-medium text-[#1f5d4f]'>AI自己紹介下書き</p>
          <p className='mt-1 text-xs leading-6 text-[#6b6b6b]'>
            登録済みのプロフィール情報から、本人視点の下書きを作成します。保存前に必ず確認・編集してください。
          </p>
        </div>
        <button
          type='button'
          disabled={!aiEnabled || loading}
          onClick={() => void generateDraft()}
          className='rounded-full border border-[#1f5d4f] bg-white px-4 py-2 text-xs font-semibold text-[#1f5d4f] transition enabled:hover:bg-[#eef4f1] disabled:cursor-not-allowed disabled:opacity-50'
        >
          {loading ? '生成中…' : 'AIで自己紹介文を下書きする'}
        </button>
      </div>

      {!aiEnabled ? (
        <p className='mt-3 text-xs text-[#9a9a9a]'>AI下書き機能は準備中です</p>
      ) : null}
      {error ? <p className='mt-3 text-xs text-rose-600'>{error}</p> : null}

      {draft ? (
        <div className='mt-4 space-y-3 rounded-2xl border border-[#e2ddd2] bg-white p-4'>
          <p className='text-[11px] font-semibold tracking-[0.16em] text-[#9a9a9a]'>AI下書き</p>
          <p className='whitespace-pre-wrap text-sm leading-7 text-[#3a3a3a]'>{draft}</p>
          <div className='flex flex-wrap gap-2'>
            <button
              type='button'
              onClick={adoptDraft}
              className='rounded-full bg-[#1f5d4f] px-4 py-2 text-xs font-semibold text-white'
            >
              この文章を使う
            </button>
            <button
              type='button'
              onClick={() => void generateDraft()}
              disabled={loading}
              className='rounded-full border border-[#d8d6d1] px-4 py-2 text-xs font-medium text-[#6b6b6b]'
            >
              もう一度作る
            </button>
            <button
              type='button'
              onClick={() => {
                onBioChange(draft);
                setDraft(null);
              }}
              className='rounded-full border border-[#d8d6d1] px-4 py-2 text-xs font-medium text-[#6b6b6b]'
            >
              自分で編集する
            </button>
            <button
              type='button'
              onClick={() => setDraft(null)}
              className='rounded-full px-4 py-2 text-xs font-medium text-[#9a9a9a]'
            >
              使わない
            </button>
          </div>
        </div>
      ) : null}

      <input type='hidden' name='bio' value={bio} />
    </div>
  );
}
