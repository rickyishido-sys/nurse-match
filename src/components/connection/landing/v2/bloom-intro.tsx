'use client';

import Image from 'next/image';
import Link from 'next/link';
import { RegisterCtaLink } from '@/components/connection/register-cta-link';
import { Heading, HK, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';
import type { HanakaiViewer } from '@/lib/hanakai/session';

const POINTS = [
  { icon: '✦', text: 'ニックネーム・年代・エリアなどの基本情報' },
  { icon: '✦', text: '興味・価値観・写真で、あなたらしさを表現' },
  { icon: '✦', text: '参加申請時に、主催者があなたを確認できます' },
] as const;

const SAMPLE_TAGS = ['カフェ', '花', '散歩', '映画', '旅行'] as const;

export function LandingBloomIntro({
  joinHref = '/register',
  viewer = null,
}: {
  joinHref?: string;
  viewer?: HanakaiViewer | null;
}) {
  const isLoggedIn = Boolean(viewer);

  return (
    <Section tone='white'>
      <div className='grid items-center gap-10 lg:grid-cols-2 lg:gap-14'>
        <div>
          <Reveal>
            <Kicker>Profile</Kicker>
          </Reveal>
          <Reveal delay={0.05}>
            <Heading className='mt-5'>
              プロフィールを作って、
              <br className='hidden sm:block' />
              体験に参加する
            </Heading>
          </Reveal>
          <Reveal delay={0.1}>
            <Lead className='mt-6 max-w-[36ch]'>
              難しい設定は不要です。あなたのことをやさしく伝えるプロフィールを作成し、
              気になる体験へ参加申請できます。
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
              <p className='text-sm font-semibold text-[#1f5d4f]'>プロフィール（イメージ）</p>
            </div>
            <div className='mt-6 space-y-4 rounded-2xl bg-white p-5 shadow-sm'>
              <div className='flex items-center gap-3'>
                <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#f3f7f5] ring-2 ring-[#e7f0ea]'>
                  <Image
                    src='/images/profile-sample.webp'
                    alt='プロフィール写真のサンプル'
                    fill
                    sizes='64px'
                    className='object-cover object-top'
                    loading='lazy'
                  />
                </div>
                <div>
                  <p className='text-sm font-semibold text-[#1f5d4f]'>Aoi</p>
                  <p className='text-xs text-[#6b6b6b]'>28歳 · 横浜</p>
                </div>
              </div>
              <div>
                <p className='text-[10px] font-medium tracking-wide text-[#9a9a9a]'>自己紹介</p>
                <p className='mt-2 text-sm leading-7 text-[#4a4a4a]'>
                  カフェ巡りが好きで、花が好き。休日は散歩しています。体験を通じて、自然な会話からつながりたいです。
                </p>
              </div>
              <div className='flex flex-wrap gap-2'>
                {SAMPLE_TAGS.map((tag) => (
                  <span key={tag} className='rounded-full bg-[#f3f7f5] px-3 py-1 text-xs text-[#1f5d4f]'>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <p className='mt-5 text-center text-[11px] leading-6 text-[#9a9a9a]'>
              評価やランキングではなく、理解のためのプロフィールです。
            </p>
            {isLoggedIn ? (
              <Link
                href='/my-profile?mode=edit'
                prefetch
                className='mt-5 flex h-11 items-center justify-center rounded-full border border-[#1f5d4f]/30 text-xs font-semibold text-[#1f5d4f] transition hover:scale-[1.02] hover:bg-[#1f5d4f]/5 active:scale-[0.98]'
              >
                プロフィールを充実させる
              </Link>
            ) : (
              <>
                <Link
                  href='/register/profile'
                  prefetch
                  className='mt-5 flex h-11 items-center justify-center rounded-full border border-[#1f5d4f]/30 text-xs font-semibold text-[#1f5d4f] transition hover:scale-[1.02] hover:bg-[#1f5d4f]/5 active:scale-[0.98]'
                >
                  無料でプロフィールを作る
                </Link>
                <div className='mt-3 flex justify-center'>
                  <RegisterCtaLink href={joinHref} className='w-full max-w-[280px]' />
                </div>
              </>
            )}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
