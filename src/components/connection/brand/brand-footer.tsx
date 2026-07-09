'use client';

import Link from 'next/link';
import { BrandCharacter } from '@/components/connection/brand/brand-character';
import { CHARACTER_ORDER } from '@/lib/connection/brand/characters';
import { BRAND_TAGLINE } from '@/lib/connection/brand/tokens';

type Props = {
  dark?: boolean;
  showCharacters?: boolean;
  adminHref?: string | null;
};

/** 統一ブランドフッター（9体キャラクター帯 + リンク） */
export function BrandFooter({ dark = true, showCharacters = true, adminHref = null }: Props) {
  const bg = dark ? 'bg-[#163f35] text-white' : 'bg-[#faf7f2] text-[#1a1a1a]';
  const muted = dark ? 'text-white/70' : 'text-[#6b6b6b]';
  const linkClass = dark ? 'text-white/80 hover:text-white' : 'text-[#1f5d4f] hover:underline';

  return (
    <footer className={`${bg} px-6 py-14`}>
      <div className='mx-auto w-full max-w-[1080px] text-center'>
        {showCharacters ? (
          <div className='mb-10 flex flex-wrap items-end justify-center gap-3 sm:gap-4'>
            {CHARACTER_ORDER.map((id) => (
              <BrandCharacter key={id} id={id} size='xs' label />
            ))}
          </div>
        ) : null}

        <p className='font-serif text-lg font-semibold tracking-[0.2em]'>華会</p>
        <p className='mt-1 text-[10px] font-medium tracking-[0.34em] opacity-60'>HANAKAI</p>
        <p className={`mx-auto mt-4 max-w-[36ch] text-xs leading-[1.9] ${muted}`}>{BRAND_TAGLINE}</p>

        <div className={`mt-7 flex flex-wrap items-center justify-center gap-5 text-xs ${linkClass}`}>
          <Link href='/events' className='underline-offset-4 hover:underline'>
            イベント
          </Link>
          <Link href='/login' className='underline-offset-4 hover:underline'>
            ログイン
          </Link>
          <Link href='/terms' className='underline-offset-4 hover:underline'>
            利用規約
          </Link>
          <Link href='/privacy' className='underline-offset-4 hover:underline'>
            プライバシー
          </Link>
          <Link href='/contact' className='underline-offset-4 hover:underline'>
            お問い合わせ
          </Link>
          {adminHref ? (
            <Link href={adminHref} className='opacity-50 underline-offset-4 hover:underline'>
              運営
            </Link>
          ) : null}
        </div>
        <p className='mt-8 text-[10px] tracking-wide opacity-40'>© {new Date().getFullYear()} HANAKAI</p>
      </div>
    </footer>
  );
}
