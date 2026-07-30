'use client';

import { motion } from 'motion/react';
import { ColorBlob, TiltFrame } from '@/components/connection/brand/brand-editorial';
import { BgTypography } from '@/components/connection/brand/bg-typography';
import { Heading, HK, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';

const FLOW_STEPS = [
  {
    title: 'プロフィールを作る',
    body: '興味のあることや、参加したい体験を登録します。本人確認書類の提出（必須）も行います。',
    color: HK.coral,
  },
  {
    title: 'HANAKAI運営が確認',
    body: '提出された本人確認書類をHANAKAI運営が確認します。認証済みになると、イベントへの参加申込・イベント作成が可能になります。',
    color: HK.sky,
  },
  {
    title: '体験を探す',
    body: '花、カフェ、食事、散歩など、気になる体験を選びます。',
    color: HK.violet,
  },
  {
    title: '参加を申し込む',
    body: '認証済みユーザーとして、気になる体験に参加申請します。',
    color: HK.amber,
  },
  {
    title: '主催者が確認',
    body: '主催者がプロフィール・参加理由・趣味・価値観・自己紹介を確認し、この体験に合うメンバーを選びます。本人確認は主催者では行いません。',
    color: HK.coral,
  },
  {
    title: '体験を楽しむ',
    body: '参加が確定したら、同じ体験を楽しみながら、自然に会話が生まれます。当日は体験を楽しむだけです。',
    color: HK.sky,
  },
] as const;

export function LandingConnectionDefinition() {
  return (
    <Section
      tone='white'
      id='hanakai-connection'
      className='relative overflow-hidden !bg-gradient-to-br from-white via-[#fff8f5] to-[#f0f8ff]'
    >
      <BgTypography text='華会' className='!text-[#1f5d4f]/[0.06]' />
      <ColorBlob color={HK.violetSoft} className='right-0 top-[20%]' />
      <ColorBlob color={HK.coralSoft} className='bottom-[10%] left-0' />

      <div className='relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left'>
        <Reveal>
          <Kicker>華会</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>趣味や体験から始まる、新しいつながり。</Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead className='hk-copy-ja mt-6 max-w-[52ch] text-left sm:text-center lg:text-left'>
            <span className='block'>華会は、花、カフェ、食事、散歩など、</span>
            <span className='block'>好きなことや興味のある体験を通じて、</span>
            <span className='block'>新しい人と自然につながれるコミュニティです。</span>
            <span className='mt-4 block'>SNSで人を選ぶのではなく、</span>
            <span className='block'>体験を通じて人を知っていく。</span>
            <span className='mt-4 block'>評価してから会うのではなく、</span>
            <span className='block'>一緒に過ごす時間から理解が始まる。</span>
            <span className='mt-4 block font-medium text-[#1a1a1a]'>華会は、そんな新しいつながり方をつくります。</span>
          </Lead>
        </Reveal>
      </div>

      <Reveal delay={0.15} className='relative z-10 mt-16'>
        <p className='mb-8 text-center text-[11px] font-bold tracking-[0.24em] text-[#9a9a9a] lg:text-left'>
          参加の流れ
        </p>
        <ol className='mx-auto grid max-w-[640px] gap-4 lg:mx-0'>
          {FLOW_STEPS.map((step, i) => (
            <li key={step.title}>
              <TiltFrame tilt={i % 2 === 0 ? -2 : 3}>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 * i }}
                  className='rounded-2xl border border-[#ebe9e4] bg-white p-5 text-left shadow-sm'
                >
                  <p className='text-[11px] font-bold tracking-[0.2em]' style={{ color: step.color }}>
                    STEP {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className='mt-2 font-serif text-lg font-bold text-[#1a1a1a]'>{step.title}</h3>
                  <p className='hk-copy-ja mt-2 text-sm leading-relaxed text-[#5a5247]'>{step.body}</p>
                </motion.div>
              </TiltFrame>
            </li>
          ))}
        </ol>
        <p className='hk-copy-ja mt-10 text-center text-sm leading-8 text-[#5a5247] lg:text-left'>
          <span className='block'>プロフィールだけでは分からない相手の魅力を、</span>
          <span className='block'>一緒に過ごす時間の中で知っていく。</span>
          <span className='mt-2 block'>華会では、体験を重ねながら新しいつながりを広げていきます。</span>
        </p>
      </Reveal>
    </Section>
  );
}
