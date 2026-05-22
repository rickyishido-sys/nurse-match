'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ONBOARDING_KEY = 'nursematch:onboarding-seen:v1';

const SLIDES = [
  {
    title: 'ようこそ、ナースマッチへ',
    body: '看護師を中心とした、\n安心重視のマッチングサービスです。',
  },
  {
    title: '安心して利用できる環境づくり',
    body:
      '安心してご利用いただくため、\n登録時に本人確認およびAIを活用した登録審査を行っています。\n\nなお、審査基準や結果理由については\n個別にお答えしておりません。',
  },
  {
    title: '気になる相手を見つける',
    body: 'あなたに合う候補を厳選表示。\n\n気になった相手だけ、\nゆっくり深掘りできます。',
  },
  {
    title: 'マッチ後にメッセージ開始',
    body: 'マッチが成立すると、\nアプリ内チャットで会話できます。',
  },
  {
    title: 'それでは始めましょう',
    body: 'あなたに合う、\n安心できる出会いを。',
  },
] as const;

export function OnboardingTutorial() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const isLast = activeIndex === SLIDES.length - 1;
  const isClient = typeof window !== 'undefined';
  const hasSeen = (() => {
    if (!isClient) return false;
    try {
      return window.localStorage.getItem(ONBOARDING_KEY) === '1';
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    if (hasSeen) router.replace('/register');
  }, [hasSeen, router]);

  function finish() {
    try {
      window.localStorage.setItem(ONBOARDING_KEY, '1');
    } catch {
      // noop
    }
    router.replace('/register');
  }

  if (!isClient || hasSeen) {
    return (
      <main className='min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff_0%,_#fdf2f8_45%,_#ffffff_100%)]' />
    );
  }

  return (
    <main className='min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff_0%,_#fdf2f8_45%,_#ffffff_100%)] px-4 py-8'>
      <div className='mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[420px] flex-col justify-between rounded-[32px] border border-sky-100/80 bg-white/95 p-6 shadow-[0_16px_45px_-35px_rgba(15,23,42,0.3)] backdrop-blur-sm sm:p-7'>
        <div className='mb-4 flex items-center justify-between'>
          <p className='text-xs font-semibold tracking-wide text-slate-500'>Nurse Match Onboarding</p>
          {!isLast ? (
            <button type='button' onClick={finish} className='rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600'>
              スキップ
            </button>
          ) : <span className='w-[68px]' />}
        </div>

        <div className='relative flex-1 overflow-hidden'>
          <div className='flex h-full w-full transition-transform duration-300 ease-out' style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
            {SLIDES.map((slide) => (
              <article key={slide.title} className='w-full shrink-0 py-3'>
                <div className='mb-6 h-1.5 w-16 rounded-full bg-gradient-to-r from-sky-300 to-pink-300' />
                <h1 className='text-2xl font-bold leading-snug text-slate-900'>{slide.title}</h1>
                <p className='mt-5 whitespace-pre-line text-sm leading-7 text-slate-600'>{slide.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className='mt-6'>
          <div className='mb-5 flex items-center justify-center gap-2'>
            {SLIDES.map((slide, idx) => (
              <span
                key={slide.title}
                className={`h-1.5 rounded-full transition-all ${idx === activeIndex ? 'w-6 bg-slate-900' : 'w-2 bg-slate-300'}`}
              />
            ))}
          </div>
          <button
            type='button'
            onClick={() => {
              if (isLast) {
                finish();
                return;
              }
              setActiveIndex((prev) => Math.min(prev + 1, SLIDES.length - 1));
            }}
            className='h-12 w-full rounded-2xl bg-slate-900 text-sm font-semibold text-white shadow-[0_14px_26px_-18px_rgba(15,23,42,0.8)]'
          >
            {isLast ? 'はじめる' : '次へ'}
          </button>
        </div>
      </div>
    </main>
  );
}
