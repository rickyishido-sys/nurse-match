'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ColorBlob, TiltFrame } from '@/components/connection/brand/brand-editorial';
import { Heading, HK, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';

type Step = { title: string; body: string };

type Flow = {
  kicker: string;
  audience: string;
  title: string;
  lead: string;
  accent: string;
  icon: ReactNode;
  steps: Step[];
  lgCols: string;
  cta: { label: string; href: string };
};

function FlowIcon({ color, children }: { color: string; children: ReactNode }) {
  return (
    <svg
      viewBox='0 0 48 48'
      className='h-6 w-6'
      fill='none'
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      {children}
    </svg>
  );
}

function buildFlows(joinHref: string): Flow[] {
  return [
    {
      kicker: 'Step 1 · Get started',
      audience: '全ユーザー共通',
      title: 'HANAKAIへの登録方法',
      lead: 'アカウント作成からプロフィール登録、本人確認まで。すべてのユーザー共通の登録フローです。',
      accent: HK.green,
      icon: (
        <FlowIcon color={HK.green}>
          <circle cx='19' cy='17' r='6' />
          <path d='M8 39c1.6-6.4 6-10 11-10s9.4 3.6 11 10' />
          <path d='M34 14v10M29 19h10' />
        </FlowIcon>
      ),
      lgCols: 'lg:grid-cols-3',
      cta: { label: 'プロフィールを作る', href: joinHref || '/register' },
      steps: [
        {
          title: 'アカウントを作成',
          body: 'メールアドレスなどを入力して、HANAKAIのアカウントを作成します。',
        },
        {
          title: 'プロフィールを登録',
          body: '趣味・興味・価値観・参加したい体験などを登録します。参加者選定や、より良いつながりづくりに活用されます。',
        },
        {
          title: '本人確認',
          body: '安心して利用できる環境を守るため、本人確認書類を提出していただきます。完了すると、参加申込やイベント作成ができるようになります。',
        },
      ],
    },
    {
      kicker: 'Step 2 · Join',
      audience: '参加者向け',
      title: 'イベントへの参加方法',
      lead: '気になる体験を見つけて申込。HANAKAIが徴収するのは利用料500円（税込）のみです。',
      accent: HK.sky,
      icon: (
        <FlowIcon color={HK.sky}>
          <circle cx='21' cy='21' r='12' />
          <path d='M30 30l9 9' />
        </FlowIcon>
      ),
      lgCols: 'lg:grid-cols-4',
      cta: { label: 'イベントを見る', href: '/events' },
      steps: [
        {
          title: 'イベントを探す',
          body: '興味のある体験や、参加してみたいイベントを探します。',
        },
        {
          title: '参加を申し込む',
          body: 'イベント内容や当日費用を確認して申込。クレジットカードを登録しますが、この時点では料金は発生しません。',
        },
        {
          title: '参加決定',
          body: '主催者または運営が参加者を決定します。決定した時点で、登録済みのカードからHANAKAI利用料500円（税込）が決済されます。',
        },
        {
          title: 'イベント当日',
          body: '飲食代・体験料・入場料などが別途必要な場合は、当日に店舗・会場または主催者へ直接お支払いください。',
        },
      ],
    },
    {
      kicker: 'Step 3 · Host',
      audience: '誰でも作れます',
      title: 'イベントを作る方法',
      lead: '会場を持っていなくても大丈夫。認証済みユーザーなら、誰でも自分の体験を企画・開催できます。',
      accent: HK.coral,
      icon: (
        <FlowIcon color={HK.coral}>
          <rect x='8' y='11' width='32' height='29' rx='4' />
          <path d='M8 19h32M16 7v8M32 7v8' />
          <path d='M24 25v9M19.5 29.5h9' />
        </FlowIcon>
      ),
      lgCols: 'lg:grid-cols-5',
      cta: { label: 'イベントを作る', href: '/events/create' },
      steps: [
        {
          title: 'イベント内容を登録',
          body: '開催日時、場所、定員、内容、当日かかる費用などを入力します。',
        },
        {
          title: '開催場所を確認',
          body: '店舗・施設を利用する場合は、必要に応じて予約や利用許可を確認してください。',
        },
        {
          title: 'イベントを公開',
          body: '内容を確認し、イベントを公開します。',
        },
        {
          title: '参加者を決定',
          body: '申込者のプロフィールを確認し、一緒に体験したい参加者を選びます。',
        },
        {
          title: 'イベントを開催',
          body: '参加者へ必要な案内を行い、当日のイベントを開催します。',
        },
      ],
    },
  ];
}

function StepCard({ n, accent, step }: { n: number; accent: string; step: Step }) {
  return (
    <div
      className='flex h-full flex-col rounded-[1.5rem] bg-white px-5 py-6 shadow-[0_12px_36px_rgba(0,0,0,0.06)]'
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className='flex items-center gap-3'>
        <span
          className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white'
          style={{ backgroundColor: accent }}
        >
          {n}
        </span>
        <span className='text-[11px] font-bold tracking-[0.2em]' style={{ color: accent }}>
          STEP {String(n).padStart(2, '0')}
        </span>
      </div>
      <p className='mt-4 text-[15px] font-bold text-[#1a1a1a]'>{step.title}</p>
      <p className='mt-2 text-[13px] leading-[1.85] text-[#5a5247]'>{step.body}</p>
    </div>
  );
}

function FlowBlock({ flow }: { flow: Flow }) {
  return (
    <div className='relative z-10'>
      <Reveal>
        <div className='flex flex-col items-center text-center lg:items-start lg:text-left'>
          <span
            className='inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold'
            style={{ backgroundColor: `${flow.accent}18`, color: flow.accent }}
          >
            {flow.icon}
            {flow.audience}
          </span>
          <Kicker>{flow.kicker}</Kicker>
          <Heading className='mt-2'>{flow.title}</Heading>
          <Lead className='mt-4 max-w-[52ch]'>{flow.lead}</Lead>
        </div>
      </Reveal>

      <div className={`mt-8 grid gap-4 sm:grid-cols-2 ${flow.lgCols} lg:gap-5`}>
        {flow.steps.map((step, i) => (
          <Reveal key={step.title} delay={0.05 * i}>
            <TiltFrame tilt={i % 2 === 0 ? -1.5 : 1.5} hover={false}>
              <StepCard n={i + 1} accent={flow.accent} step={step} />
            </TiltFrame>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <div className='mt-8 flex justify-center lg:justify-start'>
          <Link
            href={flow.cta.href}
            className='inline-flex min-h-12 items-center justify-center rounded-full px-8 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(0,0,0,0.12)] transition hover:brightness-105 active:scale-[0.98]'
            style={{ backgroundColor: flow.accent }}
          >
            {flow.cta.label}
          </Link>
        </div>
      </Reveal>
    </div>
  );
}

export function LandingGuideFlows({ joinHref = '/register' }: { joinHref?: string }) {
  const flows = buildFlows(joinHref);
  return (
    <Section tone='cream' id='how-to-use' className='relative overflow-hidden !bg-gradient-to-b from-[#fff8f5] via-[#faf7f2] to-[#f5f0ff]'>
      <ColorBlob color={HK.skySoft} className='right-[-5%] top-[6%]' />
      <ColorBlob color={HK.coralSoft} className='left-[-4%] bottom-[10%]' />

      <div className='relative z-10 flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>How to use</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>HANAKAIの使い方</Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead className='mt-6 max-w-[46ch]'>
            登録から参加、イベント作成まで。はじめての方でも迷わないよう、ステップでご案内します。
          </Lead>
        </Reveal>
      </div>

      <div className='mt-16 space-y-20'>
        {flows.map((flow) => (
          <FlowBlock key={flow.title} flow={flow} />
        ))}
      </div>
    </Section>
  );
}
