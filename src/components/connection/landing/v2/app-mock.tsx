'use client';

import type { ReactNode } from 'react';
import { Heading, HK, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';

function Phone({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='w-[220px] shrink-0 snap-center sm:w-[248px]'>
      <div className='relative mx-auto h-[460px] w-full overflow-hidden rounded-[2.4rem] border-[7px] border-[#1a1a1a] bg-[#faf7f2] shadow-[0_18px_50px_rgba(26,26,26,0.18)] sm:h-[500px]'>
        <div className='absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-[#1a1a1a]' />
        <div className='flex h-full flex-col'>
          <div className='flex items-center justify-between px-4 pb-2 pt-7'>
            <span className='text-[11px] font-semibold tracking-[0.16em] text-[#1f5d4f]'>HANAKAI</span>
            <span className='text-[10px] text-[#9a9a9a]'>{label}</span>
          </div>
          <div className='flex-1 overflow-hidden px-3 pb-3'>{children}</div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, meta, badge }: { title: string; meta: string; badge?: string }) {
  return (
    <div className='rounded-xl border border-[#ebe9e4] bg-white p-3'>
      <div className='flex items-start justify-between gap-2'>
        <p className='text-[11px] font-semibold leading-snug text-[#1a1a1a]'>{title}</p>
        {badge ? (
          <span className='shrink-0 rounded-full bg-[#e7f0ea] px-2 py-0.5 text-[9px] font-semibold text-[#1f5d4f]'>
            {badge}
          </span>
        ) : null}
      </div>
      <p className='mt-1 text-[10px] text-[#6b6b6b]'>{meta}</p>
    </div>
  );
}

export function LandingAppMock() {
  return (
    <Section tone='cream'>
      <div className='flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>Point 06</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>Ver1.0でできること</Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead className='mt-6 max-w-[42ch]'>
            イベントの探索から参加申請、プロフィール作成、主催・運営の確認まで。
            リアルな体験に集中できる、シンプルな導線です。
          </Lead>
        </Reveal>
      </div>

      <Reveal delay={0.15}>
        <div className='-mx-6 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
          <Phone label='イベント'>
            <div className='space-y-2'>
              <p className='text-[10px] font-semibold text-[#1f5d4f]'>今週の体験</p>
              <Card title='カフェで語らう会' meta='土曜 · 渋谷 · 定員8名' badge='募集中' />
              <Card title='花と散歩クラブ' meta='日曜 · 代々木 · 定員10名' />
              <Card title='バーで交流する会' meta='金曜 · 恵比寿 · 定員6名' badge='残りわずか' />
            </div>
          </Phone>

          <Phone label='参加申請'>
            <div className='space-y-3'>
              <div className='rounded-xl bg-gradient-to-br from-[#e7f0ea] to-white p-4'>
                <p className='text-[11px] font-semibold text-[#1a1a1a]'>カフェで語らう会</p>
                <p className='mt-1 text-[10px] text-[#6b6b6b]'>参加申請を送信しました</p>
              </div>
              <div className='rounded-xl border border-[#ebe9e4] bg-white p-3 text-[10px] leading-relaxed text-[#5a5247]'>
                主催者または運営が申請を確認します。承認後、当日の案内をご確認ください。
              </div>
              <button
                type='button'
                className='w-full rounded-full border border-[#d8d3cb] py-2 text-[10px] font-semibold text-[#6b6b6b]'
              >
                参加をキャンセル
              </button>
            </div>
          </Phone>

          <Phone label='プロフィール'>
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <span className='h-12 w-12 rounded-full bg-[#e7ddcf]' />
                <div>
                  <p className='text-[11px] font-semibold text-[#1a1a1a]'>Aoi</p>
                  <p className='text-[10px] text-[#6b6b6b]'>30代 · 東京 · デザイン</p>
                </div>
              </div>
              <div className='rounded-xl bg-white p-3'>
                <p className='text-[10px] font-medium text-[#9a9a9a]'>自己紹介</p>
                <p className='mt-1 text-[10px] leading-relaxed text-[#4a4a4a]'>
                  体験を通じて、自然な会話からつながりたいです。
                </p>
              </div>
              <div className='flex flex-wrap gap-1.5'>
                {['カフェ', '散歩', '花'].map((tag) => (
                  <span key={tag} className='rounded-full bg-[#f3f7f5] px-2 py-0.5 text-[9px] text-[#1f5d4f]'>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Phone>

          <Phone label='主催・運営'>
            <div className='space-y-2'>
              <p className='text-[10px] font-semibold text-[#1f5d4f]'>参加者の確認</p>
              <Card title='Ken · 参加申請' meta='承認待ち' badge='確認' />
              <Card title='Mio · 参加申請' meta='承認待ち' badge='確認' />
              <div className='mt-2 space-y-1.5'>
                <button
                  type='button'
                  className='w-full rounded-full py-2 text-[10px] font-semibold text-white'
                  style={{ backgroundColor: HK.green }}
                >
                  イベントを編集
                </button>
                <button
                  type='button'
                  className='w-full rounded-full border border-[#d8d3cb] py-2 text-[10px] font-semibold text-[#6b6b6b]'
                >
                  イベントを中止
                </button>
              </div>
            </div>
          </Phone>
        </div>
      </Reveal>
    </Section>
  );
}
