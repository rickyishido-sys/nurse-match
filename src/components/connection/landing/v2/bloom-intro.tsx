'use client';

import Link from 'next/link';
import { Heading, HK, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';

const POINTS = [
  { icon: '✦', text: 'プロフィールの要点を、やさしく整理' },
  { icon: '✦', text: '会話のきっかけを、自然な言葉で提案' },
  { icon: '✦', text: '参加が増えるほど、あなたらしさが育つ' },
] as const;

export function LandingBloomIntro() {
  return (
    <Section tone='white'>
      <div className='grid items-center gap-10 lg:grid-cols-2 lg:gap-14'>
        <div>
          <Reveal>
            <Kicker>Bloom Profile</Kicker>
          </Reveal>
          <Reveal delay={0.05}>
            <Heading className='mt-5'>
              AIが、あなたらしさを
              <br className='hidden sm:block' />
              整理します
            </Heading>
          </Reveal>
          <Reveal delay={0.1}>
            <Lead className='mt-6 max-w-[36ch]'>
              難しい設定や長い説明は不要です。
              あなたのプロフィールと体験から、会話の入口や自己紹介の要点を整えます。
            </Lead>
          </Reveal>
          <Reveal delay={0.15}>
            <ul className='mt-8 space-y-3'>
              {POINTS.map((p) => (
                <li key={p.text} className='flex items-start gap-3 text-sm leading-7 text-[#4a4a4a]'>
                  <span style={{ color: HK.gold }} aria-hidden>
                    {p.icon}
                  </span>
                  {p.text}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.12}>
          <div className='rounded-[2rem] border border-[#ece3d4] bg-gradient-to-br from-[#f3f7f5] to-[#faf7f2] p-6 sm:p-8'>
            <div className='flex items-center gap-2'>
              <span className='text-2xl' aria-hidden>
                🌸
              </span>
              <p className='text-sm font-semibold text-[#1f5d4f]'>Bloom Profile（イメージ）</p>
            </div>
            <div className='mt-6 space-y-4 rounded-2xl bg-white p-5 shadow-sm'>
              <div>
                <p className='text-[10px] font-medium tracking-wide text-[#9a9a9a]'>Bloom Summary</p>
                <p className='mt-1 text-sm font-semibold text-[#1f5d4f]'>花と対話を楽しむ人</p>
                <p className='mt-2 text-sm leading-7 text-[#4a4a4a]'>
                  体験を通じて人とつながることを大切にしているようです。
                </p>
              </div>
              <div>
                <p className='text-[10px] font-medium tracking-wide text-[#9a9a9a]'>Conversation Starters</p>
                <ul className='mt-2 space-y-1 text-sm text-[#4a4a4a]'>
                  <li>・最近参加したイベントは？</li>
                  <li>・休日はどんな過ごし方をしますか？</li>
                </ul>
              </div>
            </div>
            <p className='mt-5 text-center text-[11px] leading-6 text-[#9a9a9a]'>
              評価やランキングではなく、理解のためのプロフィールです。
            </p>
            <Link
              href='/register/profile'
              className='mt-5 flex h-11 items-center justify-center rounded-full border border-[#1f5d4f]/30 text-xs font-semibold text-[#1f5d4f] transition hover:bg-[#1f5d4f]/5'
            >
              プロフィールを作ってみる
            </Link>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
