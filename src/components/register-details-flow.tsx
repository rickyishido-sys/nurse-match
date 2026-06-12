'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { registerDetailsAction } from '@/lib/actions';

type RegisterDetailsDefaults = {
  gender: 'female' | 'male';
  nickname: string;
  birthdate: string;
  location: string;
  desiredGender: 'male' | 'female' | 'both';
};

type RegisterDetailsFlowProps = {
  defaults: RegisterDetailsDefaults;
  error?: string;
};

type RegisterDetailsDraft = {
  password: string;
  passwordConfirm: string;
  gender: 'female' | 'male';
  nickname: string;
  birthdate: string;
  location: string;
  desiredGender: 'male' | 'female' | 'both';
  agreeTerms: boolean;
  agreePrivacy: boolean;
};

const REGISTER_DETAILS_DRAFT_KEY = 'nursematch:register-details-draft:v1';

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県',
  '沖縄県',
] as const;

function createDefaultDraft(defaults: RegisterDetailsDefaults): RegisterDetailsDraft {
  return {
    password: '',
    passwordConfirm: '',
    gender: defaults.gender,
    nickname: defaults.nickname,
    birthdate: defaults.birthdate,
    location: defaults.location,
    desiredGender: defaults.gender === 'male' ? 'female' : defaults.desiredGender,
    agreeTerms: false,
    agreePrivacy: false,
  };
}

function readDraft(defaults: RegisterDetailsDefaults): RegisterDetailsDraft {
  const fallback = createDefaultDraft(defaults);
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.sessionStorage.getItem(REGISTER_DETAILS_DRAFT_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<RegisterDetailsDraft>;
    const merged: RegisterDetailsDraft = {
      ...fallback,
      ...parsed,
    };
    if (merged.gender === 'male') {
      merged.desiredGender = 'female';
    }
    return merged;
  } catch {
    return fallback;
  }
}

export function RegisterDetailsFlow({ defaults, error }: RegisterDetailsFlowProps) {
  const [draft, setDraft] = useState<RegisterDetailsDraft>(() => readDraft(defaults));
  const [uploadError, setUploadError] = useState<string | null>(null);
  const gender = draft.gender;
  const desiredGender = draft.desiredGender;
  const location = draft.location;

  useEffect(() => {
    try {
      window.sessionStorage.setItem(REGISTER_DETAILS_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // noop
    }
  }, [draft]);

  const locationOptions = useMemo(() => {
    const trimmed = location.trim() || defaults.location.trim();
    if (!trimmed || PREFECTURES.includes(trimmed as (typeof PREFECTURES)[number])) {
      return PREFECTURES;
    }
    return [trimmed, ...PREFECTURES];
  }, [defaults.location, location]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    const formData = new FormData(event.currentTarget);
    const profileImage = formData.get('profileImage');
    const identityDocument = formData.get('identityDocument');
    const nurseDocument = formData.get('nurseDocument');
    const files = [profileImage, identityDocument, nurseDocument].filter((value): value is File => value instanceof File && value.size > 0);
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    // Keep request payload under platform limits to avoid 413 hard-failure before action runs.
    if (totalSize > 20 * 1024 * 1024) {
      event.preventDefault();
      setUploadError('画像サイズの合計は20MB以下にしてください');
      return;
    }
    setUploadError(null);
  };

  return (
    <main className='min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff_0%,_#fdf2f8_45%,_#ffffff_100%)] px-4 py-8'>
      <div className='mx-auto w-full max-w-[430px]'>
        <section className='rounded-[32px] border border-sky-100/80 bg-white/95 p-6 shadow-[0_16px_45px_-35px_rgba(15,23,42,0.3)] backdrop-blur-sm sm:p-7'>
          <div className='mb-4 flex justify-center'>
            <Image
              src='/logo/nurse-match-logo-horizontal.png'
              alt='ナースマッチ ロゴ'
              width={300}
              height={94}
              className='h-12 w-auto object-contain sm:h-14'
              priority
            />
          </div>
          <h1 className='text-center text-2xl font-bold text-slate-900'>プロフィールを作成</h1>
          <p className='mt-1 text-center text-sm text-slate-600'>あと少しで登録完了</p>
          <p className='mt-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs leading-6 text-sky-800'>
            メール認証が完了しました。続けてログイン用パスワードとプロフィールを設定してください。
          </p>

          {error === 'required' ? <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>必須項目を入力してください。</p> : null}
          {error === 'password-required' ? (
            <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>ログイン用パスワードを入力してください。</p>
          ) : null}
          {error === 'password-length' ? (
            <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>パスワードは8文字以上で入力してください。</p>
          ) : null}
          {error === 'password-mismatch' ? (
            <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>確認用パスワードが一致しません。</p>
          ) : null}
          {error === 'password-update-failed' ? (
            <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>パスワード設定に失敗しました。時間をおいて再度お試しください。</p>
          ) : null}
          {error === 'profile-image-required' ? <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>プロフィール画像を1枚追加してください。</p> : null}
          {error === 'identity-required' ? <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>本人確認書類をアップロードしてください。</p> : null}
          {error === 'nurse-document-required' ? <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>女性会員は看護師確認書類が必須です。</p> : null}
          {error === 'terms-required' ? <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>利用規約とプライバシーポリシーへの同意が必要です。</p> : null}
          {error === 'save-failed' ? (
            <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>
              保存に失敗しました。時間をおいて再度お試しください。
            </p>
          ) : null}
          {error === 'unexpected' ? (
            <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>
              予期しないエラーが発生しました。お手数ですが時間をおいて再度お試しください。
            </p>
          ) : null}
          {uploadError ? (
            <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>{uploadError}</p>
          ) : null}

          <form action={registerDetailsAction} onSubmit={handleSubmit} className='mt-5 space-y-4'>
            <article className='space-y-3'>
              <label className='grid gap-1 text-sm'>
                パスワード
                <input
                  type='password'
                  name='password'
                  required
                  minLength={8}
                  value={draft.password}
                  onChange={(e) => setDraft((prev) => ({ ...prev, password: e.target.value }))}
                  className='h-11 rounded-xl border border-slate-200 px-3'
                />
              </label>
              <label className='grid gap-1 text-sm'>
                パスワード（確認）
                <input
                  type='password'
                  name='passwordConfirm'
                  required
                  minLength={8}
                  value={draft.passwordConfirm}
                  onChange={(e) => setDraft((prev) => ({ ...prev, passwordConfirm: e.target.value }))}
                  className='h-11 rounded-xl border border-slate-200 px-3'
                />
              </label>
              <label className='grid gap-1 text-sm'>
                性別
                <select
                  name='gender'
                  value={gender}
                  onChange={(e) => {
                    const nextGender = e.target.value as 'female' | 'male';
                    setDraft((prev) => ({
                      ...prev,
                      gender: nextGender,
                      desiredGender: nextGender === 'male' ? 'female' : prev.desiredGender,
                    }));
                  }}
                  className='h-11 rounded-xl border border-slate-200 px-3'
                >
                  <option value='female'>女性</option>
                  <option value='male'>男性</option>
                </select>
              </label>
              <label className='grid gap-1 text-sm'>
                ニックネーム
                <input
                  name='nickname'
                  required
                  value={draft.nickname}
                  onChange={(e) => setDraft((prev) => ({ ...prev, nickname: e.target.value }))}
                  className='h-11 rounded-xl border border-slate-200 px-3'
                />
              </label>
              <label className='grid gap-1 text-sm'>
                生年月日
                <input
                  type='date'
                  name='birthdate'
                  required
                  value={draft.birthdate}
                  onChange={(e) => setDraft((prev) => ({ ...prev, birthdate: e.target.value }))}
                  className='h-11 rounded-xl border border-slate-200 px-3'
                />
              </label>
              <label className='grid gap-1 text-sm'>
                居住地
                <select
                  name='location'
                  required
                  value={location}
                  onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
                  className='h-11 rounded-xl border border-slate-200 px-3'
                >
                  <option value='' disabled>
                    都道府県を選択
                  </option>
                  {locationOptions.map((prefecture) => (
                    <option key={prefecture} value={prefecture}>
                      {prefecture}
                    </option>
                  ))}
                </select>
              </label>
              <label className='grid gap-1 text-sm'>
                出会いたい相手
                <select
                  name='desiredGender'
                  value={desiredGender}
                  onChange={(e) => setDraft((prev) => ({ ...prev, desiredGender: e.target.value as 'male' | 'female' | 'both' }))}
                  className='h-11 rounded-xl border border-slate-200 px-3'
                >
                  {gender === 'male' ? (
                    <option value='female'>女性</option>
                  ) : (
                    <>
                      <option value='male'>男性</option>
                      <option value='female'>女性</option>
                      <option value='both'>どちらも</option>
                    </>
                  )}
                </select>
                {gender === 'male' ? <p className='text-[11px] text-slate-500'>男性登録者は「女性」が固定となります。</p> : null}
              </label>
            </article>

            <article className='space-y-3'>
              <label className='grid gap-1 text-sm'>
                プロフィール画像
                <input type='file' name='profileImage' required className='rounded-xl border border-slate-200 px-3 py-2' />
              </label>
              <label className='grid gap-1 text-sm'>
                本人確認書類（必須）
                <input type='file' name='identityDocument' required className='rounded-xl border border-slate-200 px-3 py-2' />
                <span className='text-[11px] text-slate-500'>運転免許証・マイナンバーカード・保険証などの画像</span>
              </label>
              {gender === 'female' ? (
                <label className='grid gap-1 text-sm'>
                  看護師確認書類（女性は必須）
                  <input type='file' name='nurseDocument' required className='rounded-xl border border-slate-200 px-3 py-2' />
                  <span className='text-[11px] text-slate-500'>看護師免許証・職員証などの画像。審査にのみ使用し、他のユーザーには公開されません。</span>
                </label>
              ) : null}
              <label className='flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600'>
                <input
                  type='checkbox'
                  name='agreeTerms'
                  required
                  checked={draft.agreeTerms}
                  onChange={(e) => setDraft((prev) => ({ ...prev, agreeTerms: e.target.checked }))}
                />
                <Link
                  href='/terms?returnTo=/register/details'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='underline underline-offset-2'
                >
                  利用規約
                </Link>
                に同意する
              </label>
              <label className='flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600'>
                <input
                  type='checkbox'
                  name='agreePrivacy'
                  required
                  checked={draft.agreePrivacy}
                  onChange={(e) => setDraft((prev) => ({ ...prev, agreePrivacy: e.target.checked }))}
                />
                <Link
                  href='/privacy?returnTo=/register/details'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='underline underline-offset-2'
                >
                  プライバシーポリシー
                </Link>
                に同意する
              </label>
            </article>

            <button type='submit' className='h-11 w-full rounded-2xl bg-slate-900 text-sm font-semibold text-white'>
              登録を完了する
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
