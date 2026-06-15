'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ONBOARDING_KEY = 'hanakai:onboarding-seen:v1';

const SLIDES = [
  {
    key: 'welcome',
    title: 'ようこそ、花会へ',
    body:
      'HANAKAI（花会）は、リアルの花会とデジタルコミュニティを循環させる、新しいつながりのかたちです。\n\n花教室でも、ただのSNSでもありません。リアルの体験を起点に、関係性がゆっくり深まっていきます。',
    image: '/onboarding/welcome.png',
  },
  {
    key: 'discover',
    title: 'リアルの花会で出会う',
    body:
      '花をいけ、同じ時間を過ごし、その場の人と語らう。\n\nお近くの花会をさがして参加してみましょう。一人参加も大歓迎。初心者向けの会もあります。',
    image: '/onboarding/discover.png',
  },
  {
    key: 'message',
    title: 'アプリで想いを知る',
    body:
      '自分の作品や想いを投稿し、ほかの人の作品や人柄を知る。\n\n気になる人をフォローし、「気になる」「応援したい」「花会で会ってみたい」を伝えられます。',
    image: '/onboarding/message.png',
  },
  {
    key: 'safety',
    title: '共感で応援する',
    body:
      'かわいい人にではなく、夢・挑戦・活動への共感で応援する。\n\n講師になりたい人、地域花会を立ち上げたい人、花屋を開きたい人。応援（投げ花）は、その大部分が本人に届く設計です。',
    image: '/onboarding/safety.png',
  },
  {
    key: 'start',
    title: 'また、花会で会いましょう',
    body:
      'リアル → デジタル → リアル。\n\nこの循環を重ねるほど、関係性は深まります。花会28万人構想を、一緒に育てていきましょう。',
    image: '/onboarding/start.png',
  },
] as const;

type OnboardingTutorialProps = {
  forcePreview?: boolean;
};

export function OnboardingTutorial({ forcePreview = false }: OnboardingTutorialProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const isLast = activeIndex === SLIDES.length - 1;
  const isClient = typeof window !== 'undefined';
  const queryPreviewMode = (() => {
    if (!isClient) return false;
    return new URLSearchParams(window.location.search).get('preview') === '1';
  })();
  const shouldForce = forcePreview || queryPreviewMode;

  const hasSeen = (() => {
    if (shouldForce) return false;
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
    <main className='min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff_0%,_#fdf2f8_45%,_#ffffff_100%)] px-3 py-4'>
      <div className='mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[420px] flex-col justify-between rounded-[32px] border border-sky-100/80 bg-white/95 px-5 py-4 shadow-[0_16px_45px_-35px_rgba(15,23,42,0.3)] backdrop-blur-sm sm:px-6 sm:py-5'>
        <div className='mb-2 flex items-center justify-between'>
          <p className='text-xs font-semibold tracking-wide text-slate-500'>HANAKAI Onboarding</p>
          {!isLast ? (
            <button type='button' onClick={finish} className='rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600'>
              スキップ
            </button>
          ) : <span className='w-[68px]' />}
        </div>

        <div className='relative flex-1 overflow-hidden'>
          <div className='flex h-full w-full transition-transform duration-300 ease-out' style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
            {SLIDES.map((slide, idx) => (
              <article key={slide.key} className='w-full shrink-0 py-1'>
                <div className='mx-auto mb-2 h-1.5 w-16 rounded-full bg-gradient-to-r from-sky-300 to-pink-300' />
                <div className='mx-auto mb-2.5 w-full max-w-[320px] overflow-hidden rounded-3xl border border-pink-100 bg-gradient-to-b from-white to-pink-50/60 shadow-md'>
                  <div className='relative w-full aspect-[3/4]'>
                    <Image src={slide.image} alt={slide.title} fill className='object-cover' priority={idx === 0} />
                  </div>
                </div>
                <div className='mx-auto w-full max-w-[320px]'>
                  <h1 className='text-2xl font-bold leading-snug text-slate-900'>{slide.title}</h1>
                  <p className='mt-1.5 whitespace-pre-line text-[13px] leading-[1.72] text-slate-600'>{slide.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className='mt-2'>
          <div className='mb-2 flex items-center justify-center gap-2'>
            {SLIDES.map((slide, idx) => (
              <span
                key={slide.key}
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
            {isLast ? '進む' : '次へ'}
          </button>
        </div>
      </div>
    </main>
  );
}
