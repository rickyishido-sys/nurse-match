'use client';

import { useState } from 'react';
import { savePersonalityAction } from '@/lib/connection/actions';
import {
  formatPersonalityAxes,
  PERSONALITY_QUIZ,
  PERSONALITY_TYPE_META,
  scorePersonalityAnswers,
} from '@/lib/connection/personality';
import type { PersonalityProfile } from '@/lib/connection/types';

type PersonalityQuizProps = {
  existing?: PersonalityProfile | null;
};

export function PersonalityQuiz({ existing }: PersonalityQuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B'>>({});
  const [result, setResult] = useState<{ axes: ReturnType<typeof scorePersonalityAnswers>['axes']; type: ReturnType<typeof scorePersonalityAnswers>['type'] } | null>(
    existing ? { axes: existing.axes, type: existing.type } : null,
  );
  const [done, setDone] = useState(Boolean(existing));

  const q = PERSONALITY_QUIZ[step];
  const isLast = step === PERSONALITY_QUIZ.length - 1;

  function choose(choice: 'A' | 'B') {
    const next = { ...answers, [q.id]: choice };
    setAnswers(next);
    if (isLast) {
      const scored = scorePersonalityAnswers(next);
      setResult(scored);
      setDone(true);
    } else {
      setStep((s) => s + 1);
    }
  }

  if (done && result) {
    const meta = PERSONALITY_TYPE_META[result.type];
    return (
      <div className='space-y-4'>
        <div className='rounded-2xl border border-[#ebe9e4] bg-white p-5 text-center'>
          <p className='text-[11px] font-medium tracking-[0.2em] text-[#6b6b6b]'>診断結果</p>
          <p className='mt-2 text-2xl font-semibold text-[#1a1a1a]'>{meta.label}</p>
          <p className='mt-2 text-sm leading-7 text-[#6b6b6b]'>{meta.description}</p>
          <p className='mt-3 text-xs text-[#9a9a9a]'>{formatPersonalityAxes(result.axes)}</p>
        </div>
        <form action={savePersonalityAction}>
          <input type='hidden' name='type' value={result.type} />
          <input type='hidden' name='energy' value={result.axes.energy} />
          <input type='hidden' name='thinking' value={result.axes.thinking} />
          <input type='hidden' name='planning' value={result.axes.planning} />
          <button type='submit' className='h-12 w-full rounded-full bg-[#1a1a1a] text-sm font-semibold text-white'>
            プロフィールに保存する
          </button>
        </form>
        <button
          type='button'
          onClick={() => {
            setStep(0);
            setAnswers({});
            setResult(null);
            setDone(false);
          }}
          className='w-full text-center text-xs text-[#6b6b6b] underline-offset-2 hover:underline'
        >
          もう一度診断する
        </button>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between text-xs text-[#9a9a9a]'>
        <span>質問 {step + 1} / {PERSONALITY_QUIZ.length}</span>
        <span>{Math.round(((step + 1) / PERSONALITY_QUIZ.length) * 100)}%</span>
      </div>
      <div className='h-1 overflow-hidden rounded-full bg-[#ebe9e4]'>
        <div
          className='h-full bg-[#1a1a1a] transition-all'
          style={{ width: `${((step + 1) / PERSONALITY_QUIZ.length) * 100}%` }}
        />
      </div>
      <p className='text-sm font-semibold leading-7 text-[#1a1a1a]'>{q.text}</p>
      <div className='space-y-2'>
        <button
          type='button'
          onClick={() => choose('A')}
          className='w-full rounded-2xl border border-[#ebe9e4] bg-white px-4 py-3 text-left text-sm text-[#4a4a4a] active:scale-[0.99]'
        >
          {q.optionA.label}
        </button>
        <button
          type='button'
          onClick={() => choose('B')}
          className='w-full rounded-2xl border border-[#ebe9e4] bg-white px-4 py-3 text-left text-sm text-[#4a4a4a] active:scale-[0.99]'
        >
          {q.optionB.label}
        </button>
      </div>
    </div>
  );
}
