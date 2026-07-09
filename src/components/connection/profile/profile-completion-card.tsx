'use client';

import type { ProfileCompletionResult } from '@/lib/connection/profile-completion';

function ProgressBar({ percent }: { percent: number }) {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  return (
    <div className='flex items-center gap-3'>
      <div className='flex flex-1 gap-1' aria-hidden>
        {Array.from({ length: filled }).map((_, i) => (
          <span key={`f-${i}`} className='h-2 flex-1 rounded-full bg-[#1f5d4f]' />
        ))}
        {Array.from({ length: empty }).map((_, i) => (
          <span key={`e-${i}`} className='h-2 flex-1 rounded-full bg-[#e7e2d8]' />
        ))}
      </div>
      <span className='text-lg font-semibold tabular-nums text-[#1f5d4f]'>{percent}%</span>
    </div>
  );
}

function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function ProfileCompletionCard({ completion }: { completion: ProfileCompletionResult }) {
  const remaining = completion.incompleteItems.length;

  return (
    <section className='overflow-hidden rounded-3xl border border-[#e8dfd0] bg-gradient-to-br from-[#fbf8f3] via-[#f6f3ec] to-[#eef3ef] p-6 shadow-[0_8px_32px_rgba(31,93,79,0.06)]'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <p className='text-[11px] font-semibold tracking-[0.2em] text-[#b8956a]'>プロフィール</p>
          <h2 className='mt-1 text-lg font-semibold text-[#1a1a1a]'>プロフィール完成度</h2>
        </div>
        <span className='text-2xl' aria-hidden>
          ✿
        </span>
      </div>

      <div className='mt-5'>
        <ProgressBar percent={completion.percent} />
      </div>

      {remaining > 0 ? (
        <div className='mt-5 space-y-3'>
          <p className='text-sm text-[#4a4a4a]'>
            あと<span className='font-semibold text-[#1f5d4f]'>{remaining}</span>
            項目でプロフィールが完成します。
          </p>
          <ul className='space-y-2'>
            {completion.incompleteItems.map((item) => (
              <li key={item.id}>
                <button
                  type='button'
                  onClick={() => scrollToSection(item.sectionId)}
                  className='flex w-full items-center gap-2 rounded-xl border border-[#ebe9e4] bg-white/80 px-3 py-2.5 text-left text-sm text-[#4a4a4a] transition hover:border-[#cfe3da] hover:bg-white'
                >
                  <span className='text-[#9a9a9a]' aria-hidden>
                    □
                  </span>
                  <span>{item.incompleteLabel}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className='mt-5 text-sm leading-7 text-[#4a4a4a]'>
          プロフィールの基本が整いました。イベントに参加して、あなたの記録を育てていきましょう。
        </p>
      )}
    </section>
  );
}
