'use client';

import { useState } from 'react';
import type { BloomVersion } from '@/lib/connection/bloom-phase4-types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type Props = {
  versions: BloomVersion[];
  mode: 'owner' | 'admin';
};

function diffStarters(prev: string[], next: string[]) {
  const removed = prev.filter((s) => !next.includes(s));
  const added = next.filter((s) => !prev.includes(s));
  return { removed, added };
}

export function BloomHistoryCard({ versions, mode }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (versions.length === 0) {
    return (
      <p className='text-sm text-[#c4c0b8]'>
        {mode === 'owner'
          ? 'Bloom Profileを更新すると、ここに履歴が残ります。'
          : 'History はまだありません'}
      </p>
    );
  }

  const chronological = [...versions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <div className='space-y-2'>
      {chronological.map((version, index) => {
        const prev = index > 0 ? chronological[index - 1] : null;
        const diff = prev
          ? diffStarters(prev.conversationStarters, version.conversationStarters)
          : null;
        const isOpen = openId === version.id;

        return (
          <div key={version.id} className='rounded-xl border border-[#f1efe9] bg-[#fafaf8]'>
            <button
              type='button'
              onClick={() => setOpenId(isOpen ? null : version.id)}
              className='flex w-full items-center justify-between gap-3 px-4 py-3 text-left'
            >
              <div>
                <p className='text-sm font-semibold text-[#1a1a1a]'>Version {index + 1}</p>
                <p className='text-[10px] text-[#9a9a9a]'>{formatDate(version.createdAt)}</p>
              </div>
              <span className='text-xs text-[#6b6b6b]'>{isOpen ? '閉じる' : '差分を見る'}</span>
            </button>
            {isOpen ? (
              <div className='space-y-3 border-t border-[#f1efe9] px-4 py-3 text-sm'>
                {version.summaryTitle ? (
                  <div>
                    <p className='text-[10px] font-medium text-[#9a9a9a]'>Summary Title</p>
                    <p className='text-[#1f5d4f] font-medium'>{version.summaryTitle}</p>
                  </div>
                ) : null}
                {version.summary ? (
                  <div>
                    <p className='text-[10px] font-medium text-[#9a9a9a]'>Summary</p>
                    <p className='leading-7 text-[#4a4a4a]'>{version.summary}</p>
                  </div>
                ) : null}
                {version.conversationStarters.length > 0 ? (
                  <div>
                    <p className='text-[10px] font-medium text-[#9a9a9a]'>Conversation Starters</p>
                    <ul className='mt-1 space-y-1'>
                      {version.conversationStarters.map((s) => (
                        <li key={s} className='text-[#4a4a4a]'>
                          ・{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {diff && (diff.removed.length > 0 || diff.added.length > 0) ? (
                  <div className='rounded-lg border border-[#ebe9e4] bg-white p-3'>
                    <p className='text-[10px] font-semibold text-[#9a9a9a]'>前のバージョンからの変化</p>
                    {diff.removed.length > 0 ? (
                      <div className='mt-2'>
                        <p className='text-[10px] text-[#9a9a9a]'>以前</p>
                        <ul className='text-xs text-[#6b6b6b]'>
                          {diff.removed.map((s) => (
                            <li key={s}>・{s}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {diff.added.length > 0 ? (
                      <div className='mt-2'>
                        <p className='text-[10px] text-[#1f5d4f]'>現在</p>
                        <ul className='text-xs text-[#1a1a1a]'>
                          {diff.added.map((s) => (
                            <li key={s}>・{s}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
