'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ONBOARDING_KEY = 'nursematch:onboarding-seen:v1';

const SLIDES = [
  {
    key: 'welcome',
    title: 'ようこそ、ナースマッチへ',
    body:
      '看護師を中心とした、安心重視のマッチングサービスです。\n\n毎日の忙しさの中でも、「ちゃんと話せる人と出会いたい」そんな想いから、ナースマッチは生まれました。\n\n恋人探しも、気軽な会話も、まずは安心できることを大切にしています。',
    image: '/onboarding/welcome.png',
  },
  {
    key: 'safety',
    title: '安心して利用できる環境づくり',
    body:
      '安心して利用いただくため、登録時に本人確認およびAIを活用した登録審査を行っています。\n女性登録者は、看護師確認書類の提出による確認を実施。通報・ブロック・退会もいつでも可能です。「ちゃんと安心できる」その環境づくりを大切にしています。\nナースマッチでは、現在の職種や年収に加えて、\n・家事への考え方\n・育児への考え方\n・夜勤への理解\n・共働きへの考え方\nなどについても男性登録者へアンケートを実施しています。\n\n「ちゃんと支え合える相手か」を事前に知れることも、安心につながると考えています。\n\n誠実さや思いやりを大切にする方ほど、安心して出会える設計です。',
    image: '/onboarding/safety.png',
  },
  {
    key: 'discover',
    title: '気になる相手を見つける',
    body:
      'あなたに合う候補を厳選表示。\n\n女性登録者には、AIが相性や居住地などをもとに毎日正午に10名のお相手候補を表示します。\n\n男性登録者は、カード型プロフィールから気になるお相手へ「興味あり」を送ることができます。\n\n男性登録者にも、価値観が合う相手と出会いやすい導線を用意しています。\n\n気になった相手だけ、ゆっくり深掘りしてください。',
    image: '/onboarding/discover.png',
  },
  {
    key: 'message',
    title: 'マッチ後にメッセージ開始',
    body:
      'お互いに「興味あり」になると、アプリ内チャットで会話できます。\n直接会う前に、しっかり話して相手を知れるので安心です。\n\n何気ない会話から、思いがけない素敵な出会いが始まるかもしれません。',
    image: '/onboarding/message.png',
  },
  {
    key: 'start',
    title: 'それでは始めましょう',
    body:
      'あなたに合う、安心できる出会いを。\n\n仕事を頑張る毎日の中で、ふと誰かと話したくなる時。\n疲れた日に、少しだけ癒されたくなる時。\n\nお互いを尊重できる相手と、安心して関係を育てていきましょう。',
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
          <p className='text-xs font-semibold tracking-wide text-slate-500'>Nurse Match Onboarding</p>
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
