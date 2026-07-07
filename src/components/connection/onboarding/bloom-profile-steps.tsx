'use client';

import type { ChangeEvent } from 'react';
import {
  MBTI_OPTIONS,
  SOCIAL_LINK_PLATFORMS,
  type MbtiType,
  type SocialLinkPlatform,
} from '@/lib/connection/bloom-profile-options';
import { ONB, StepHeading } from './onboarding-ui';
import { SingleChoiceStep } from './steps';

const inputClass =
  'w-full rounded-2xl border bg-white px-5 py-[18px] text-base leading-relaxed outline-none transition focus:border-current';

const BIO_PLACEHOLDER = `こんにちは。
休日は＿＿をして過ごすことが多いです。

人と話すときは、＿＿な時間が好きです。

HANAKAIでは、体験を通して自然につながれる方と出会えたら嬉しいです。`;

/** 自己紹介文 + AI下書き（将来予定・disabled） */
export function BioStep({
  index,
  art,
  value,
  onChange,
}: {
  index: number;
  art?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <StepHeading
        index={index}
        art={art}
        title='あなたらしい自己紹介を書いてみましょう'
        subtitle='あとで編集できます'
      />
      <p className='mt-4 text-[14px] leading-7' style={{ color: ONB.subtle }}>
        HANAKAIでは、条件よりも「どんな時間を一緒に過ごせそうか」を大切にしています。
        完璧に書こうとしなくて大丈夫です。あなたらしい雰囲気が少し伝わる文章で十分です。
      </p>
      <div className='mt-6'>
        <textarea
          value={value}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          placeholder={BIO_PLACEHOLDER}
          rows={8}
          className={`${inputClass} resize-none leading-7`}
          style={{ borderColor: ONB.border, color: ONB.ink }}
        />
        <p className='mt-2 text-xs' style={{ color: ONB.subtle }}>
          任意 · 空欄のままでも登録できます
        </p>
      </div>

      <div
        className='mt-6 rounded-2xl border px-4 py-4'
        style={{ borderColor: ONB.border, backgroundColor: ONB.accentSoft }}
      >
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <p className='text-sm font-medium' style={{ color: ONB.accent }}>
            AIプロフィール下書き
          </p>
          <button
            type='button'
            disabled
            className='cursor-not-allowed rounded-full border px-4 py-2 text-xs font-medium opacity-60'
            style={{ borderColor: ONB.accent, color: ONB.accent, backgroundColor: '#fff' }}
          >
            AI下書き作成
          </button>
        </div>
        <p className='mt-3 text-xs leading-6' style={{ color: ONB.subtle }}>
          登録完了後は /my-profile から、MBTIやSNSをもとにしたAI自己紹介下書きも利用できます。
        </p>
      </div>
    </div>
  );
}

/** SNS URL 入力（保存のみ・解析なし） */
export function SocialLinksStep({
  index,
  art,
  values,
  onChange,
}: {
  index: number;
  art?: string;
  values: Partial<Record<SocialLinkPlatform, string>>;
  onChange: (platform: SocialLinkPlatform, url: string) => void;
}) {
  return (
    <div>
      <StepHeading
        index={index}
        art={art}
        title='公開SNSを登録しておきましょう'
        subtitle='任意 · 使っているものだけで大丈夫です'
      />
      <p className='mt-4 text-[14px] leading-7' style={{ color: ONB.subtle }}>
        公開しているSNSだけで大丈夫です。パスワードやログイン情報は不要です。
        将来的に、公開情報をもとにAIがあなたらしいプロフィール作成をサポートします。
      </p>
      <div className='mt-6 space-y-3'>
        {SOCIAL_LINK_PLATFORMS.map(({ platform, label, placeholder }) => (
          <div key={platform}>
            <label className='mb-1.5 block text-xs font-medium' style={{ color: ONB.subtle }}>
              {label}
            </label>
            <input
              type='url'
              inputMode='url'
              autoComplete='off'
              value={values[platform] ?? ''}
              onChange={(e) => onChange(platform, e.target.value)}
              placeholder={placeholder}
              className={inputClass}
              style={{ borderColor: ONB.border, color: ONB.ink }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** MBTI / 16タイプ（任意） */
export function MbtiStep({
  index,
  art,
  value,
  onChange,
}: {
  index: number;
  art?: string;
  value: MbtiType | '';
  onChange: (value: MbtiType) => void;
}) {
  return (
    <div>
      <SingleChoiceStep
        index={index}
        art={art}
        title='性格タイプ（MBTI）を選んでください'
        subtitle='任意 · 診断結果がなくても大丈夫です'
        options={MBTI_OPTIONS}
        value={value}
        onChange={onChange}
      />
      <p className='mt-4 text-xs leading-6' style={{ color: ONB.subtle }}>
        性格タイプは、Connection設計の参考として利用します。診断結果がない場合は、あとから入力できます。
      </p>
      {value === '' ? (
        <button
          type='button'
          onClick={() => onChange('unknown')}
          className='mt-4 text-xs underline-offset-2 hover:underline'
          style={{ color: ONB.accent }}
        >
          スキップして「あとで入力する」を選ぶ
        </button>
      ) : null}
    </div>
  );
}
