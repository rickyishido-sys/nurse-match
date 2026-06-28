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

function Bubble({ me = false, children }: { me?: boolean; children: ReactNode }) {
  return (
    <div className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
      <span
        className={`max-w-[78%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${
          me ? 'rounded-br-md bg-[#1f5d4f] text-white' : 'rounded-bl-md bg-white text-[#1a1a1a]'
        }`}
      >
        {children}
      </span>
    </div>
  );
}

export function LandingAppMock() {
  return (
    <Section tone='cream'>
      <div className='flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>Point 05</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>イベント後もつながる</Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead className='mt-6 max-w-[40ch]'>
            出会いはその日で終わりません。投稿やメッセージ、応援を通じて、つながりはゆっくり育っていきます。
          </Lead>
        </Reveal>
      </div>

      <Reveal delay={0.15}>
        <div className='-mx-6 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
          <Phone label='投稿'>
            <div className='space-y-2'>
              <div className='h-28 rounded-xl bg-gradient-to-br from-[#f7e7ec] to-[#efd6df]' />
              <div className='flex items-center gap-2'>
                <span className='h-6 w-6 rounded-full bg-[#e7ddcf]' />
                <span className='text-[11px] font-semibold text-[#1a1a1a]'>Aoi</span>
              </div>
              <p className='text-[11px] leading-relaxed text-[#5a5247]'>
                今日の花会、はじめてでしたが本当に楽しかったです🌸
              </p>
              <div className='flex items-center gap-3 text-[11px]' style={{ color: HK.gold }}>
                <span>❀ 24</span>
                <span className='text-[#9a9a9a]'>💬 6</span>
              </div>
            </div>
          </Phone>

          <Phone label='コメント'>
            <div className='space-y-2'>
              <Bubble>素敵な作品ですね！</Bubble>
              <Bubble>次回もぜひご一緒したいです</Bubble>
              <Bubble me>ありがとうございます☺️</Bubble>
              <Bubble>あの後のカフェも楽しかった！</Bubble>
            </div>
          </Phone>

          <Phone label='メッセージ'>
            <div className='space-y-2'>
              <Bubble>来月のイベント参加します？</Bubble>
              <Bubble me>もちろん！申請しました🌿</Bubble>
              <Bubble>よかった、また会えますね</Bubble>
              <Bubble me>楽しみにしています</Bubble>
            </div>
          </Phone>

          <Phone label='応援（投げ花）'>
            <div className='flex h-full flex-col items-center justify-center text-center'>
              <span className='h-14 w-14 rounded-full bg-[#e7ddcf]' />
              <p className='mt-3 text-[12px] font-semibold text-[#1a1a1a]'>Hana さんを応援</p>
              <p className='mt-1 text-[10px] text-[#9a9a9a]'>素敵な投稿に花を贈ろう</p>
              <span className='mt-4 flex items-center gap-1 rounded-full bg-[#1f5d4f] px-4 py-2 text-[11px] font-semibold text-white'>
                ❀ 花を贈る
              </span>
              <div className='mt-3 text-lg' aria-hidden>
                🌸 🌷 🌼
              </div>
            </div>
          </Phone>

          <Phone label='ライブ配信'>
            <div className='space-y-2'>
              <div className='relative h-40 overflow-hidden rounded-xl bg-gradient-to-br from-[#24463b] to-[#13261f]'>
                <span className='absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white'>
                  LIVE
                </span>
                <span className='absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[9px] text-white'>
                  👁 128
                </span>
              </div>
              <p className='text-[11px] font-semibold text-[#1a1a1a]'>春のアレンジメント配信</p>
              <div className='space-y-1'>
                <p className='text-[10px] text-[#6b6b6b]'>Mio: きれい！</p>
                <p className='text-[10px] text-[#6b6b6b]'>Ken: 参考になります</p>
              </div>
            </div>
          </Phone>
        </div>
      </Reveal>
    </Section>
  );
}
