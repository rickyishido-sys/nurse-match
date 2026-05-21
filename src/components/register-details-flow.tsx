'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { registerDetailsAction } from '@/lib/actions';

type RegisterDetailsDefaults = {
  gender: 'female' | 'male';
  nickname: string;
  birthdate: string;
  location: string;
  bio: string;
  desiredGender: 'male' | 'female' | 'both';
  workplaceType: 'hospital' | 'clinic' | 'beauty' | 'nightshift' | 'care_facility' | 'home_visit' | 'other';
  hasNightShift: boolean;
  job: string;
  income: string;
  maritalStatus: 'single' | 'married' | 'divorced' | 'partner';
  height: string;
  smoking: string;
  drinking: string;
  nightShiftUnderstanding: boolean;
  shiftWorkUnderstanding: boolean;
};

type RegisterDetailsFlowProps = {
  defaults: RegisterDetailsDefaults;
  error?: string;
};

const STEP_TITLES = ['共通情報', '女性プロフィール', '男性プロフィール', '写真'] as const;

export function RegisterDetailsFlow({ defaults, error }: RegisterDetailsFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [gender, setGender] = useState<'female' | 'male'>(defaults.gender);
  const steps = useMemo(
    () => (gender === 'female' ? (['common', 'female', 'photo'] as const) : (['common', 'male', 'photo'] as const)),
    [gender],
  );
  const safeStepIndex = Math.min(stepIndex, steps.length - 1);
  const activeStep = steps[safeStepIndex];
  const canGoPrev = safeStepIndex > 0;
  const canGoNext = safeStepIndex < steps.length - 1;
  const stepTitle =
    activeStep === 'common' ? STEP_TITLES[0] : activeStep === 'female' ? STEP_TITLES[1] : activeStep === 'male' ? STEP_TITLES[2] : STEP_TITLES[3];
  const stepLabel = useMemo(() => `STEP ${safeStepIndex + 1} / ${steps.length} - ${stepTitle}`, [safeStepIndex, steps.length, stepTitle]);

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
          <h1 className='text-center text-2xl font-bold text-slate-900'>プロフィール登録</h1>
          <p className='mt-1 text-center text-xs font-medium text-slate-500'>{stepLabel}</p>

          {error === 'required' ? (
            <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>必須項目を入力してください（18歳未満は登録不可）。</p>
          ) : null}
          {error === 'profile-image-required' ? (
            <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>
              プロフィール画像を1枚以上追加してください。
            </p>
          ) : null}
          {error === 'male-face-required' ? (
            <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>男性は顔写真を1枚以上追加してください。</p>
          ) : null}
          {error === 'save-failed' ? (
            <p className='mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700'>
              保存に失敗しました。時間をおいて再度お試しください。
            </p>
          ) : null}

          <form action={registerDetailsAction} className='mt-5 space-y-4'>
            <article className={activeStep === 'common' ? 'space-y-3' : 'hidden'}>
              <label className='grid gap-1 text-sm'>
                性別
                <select
                  name='gender'
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'female' | 'male')}
                  className='h-11 rounded-xl border border-slate-200 px-3'
                >
                  <option value='female'>女性</option>
                  <option value='male'>男性</option>
                </select>
              </label>
              <label className='grid gap-1 text-sm'>
                ニックネーム
                <input name='nickname' required defaultValue={defaults.nickname} className='h-11 rounded-xl border border-slate-200 px-3' />
              </label>
              <label className='grid gap-1 text-sm'>
                生年月日
                <input type='date' name='birthdate' required defaultValue={defaults.birthdate} className='h-11 rounded-xl border border-slate-200 px-3' />
              </label>
              <label className='grid gap-1 text-sm'>
                居住地
                <input name='location' required defaultValue={defaults.location} className='h-11 rounded-xl border border-slate-200 px-3' />
              </label>
              <label className='grid gap-1 text-sm'>
                自己紹介
                <textarea name='bio' required rows={4} defaultValue={defaults.bio} className='rounded-xl border border-slate-200 px-3 py-2' />
              </label>
            </article>

            <article className={activeStep === 'female' ? 'space-y-3' : 'hidden'}>
              <p className='rounded-2xl border border-pink-100 bg-pink-50 px-3 py-2 text-xs text-pink-700'>
                女性会員は看護師確認の審査があります。確認完了後にマッチング機能が解放されます。
              </p>
              <label className='grid gap-1 text-sm'>
                勤務形態
                <select name='workplaceType' defaultValue={defaults.workplaceType} className='h-11 rounded-xl border border-slate-200 px-3'>
                  <option value='hospital'>病院</option>
                  <option value='clinic'>クリニック</option>
                  <option value='beauty'>美容クリニック</option>
                  <option value='care_facility'>介護施設</option>
                  <option value='home_visit'>訪問看護</option>
                  <option value='other'>その他</option>
                </select>
              </label>
              <label className='grid gap-1 text-sm'>
                夜勤
                <select name='hasNightShift' defaultValue={defaults.hasNightShift ? 'on' : 'off'} className='h-11 rounded-xl border border-slate-200 px-3'>
                  <option value='on'>あり</option>
                  <option value='off'>なし</option>
                </select>
              </label>
              <label className='grid gap-1 text-sm'>
                希望する相手
                <select name='desiredGender' defaultValue={defaults.desiredGender} className='h-11 rounded-xl border border-slate-200 px-3'>
                  <option value='male'>男性</option>
                  <option value='female'>女性</option>
                  <option value='both'>どちらも</option>
                </select>
              </label>
            </article>

            <article className={activeStep === 'male' ? 'space-y-3' : 'hidden'}>
              <label className='grid gap-1 text-sm'>
                職種
                <input name='job' defaultValue={defaults.job} className='h-11 rounded-xl border border-slate-200 px-3' />
              </label>
              <label className='grid gap-1 text-sm'>
                年収帯
                <input name='income' defaultValue={defaults.income} className='h-11 rounded-xl border border-slate-200 px-3' />
              </label>
              <label className='grid gap-1 text-sm'>
                婚姻状態
                <select name='maritalStatus' defaultValue={defaults.maritalStatus} className='h-11 rounded-xl border border-slate-200 px-3'>
                  <option value='single'>独身</option>
                  <option value='married'>既婚</option>
                  <option value='divorced'>離婚</option>
                  <option value='partner'>パートナーあり</option>
                </select>
              </label>
              <label className='grid gap-1 text-sm'>
                身長
                <input name='height' defaultValue={defaults.height} className='h-11 rounded-xl border border-slate-200 px-3' />
              </label>
              <label className='grid gap-1 text-sm'>
                喫煙
                <input name='smoking' defaultValue={defaults.smoking} className='h-11 rounded-xl border border-slate-200 px-3' />
              </label>
              <label className='grid gap-1 text-sm'>
                飲酒
                <input name='drinking' defaultValue={defaults.drinking} className='h-11 rounded-xl border border-slate-200 px-3' />
              </label>
              <label className='flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm'>
                <input type='checkbox' name='nightShiftUnderstanding' defaultChecked={defaults.nightShiftUnderstanding} />
                夜勤理解あり
              </label>
              <label className='flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm'>
                <input type='checkbox' name='shiftWorkUnderstanding' defaultChecked={defaults.shiftWorkUnderstanding} />
                シフト勤務理解あり
              </label>
            </article>

            <article className={activeStep === 'photo' ? 'space-y-3' : 'hidden'}>
              <p className='rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600'>
                プロフィール画像は最大3枚まで。男性は顔写真1枚以上、女性はプロフィール画像1枚以上が必須です。
              </p>
              <label className='grid gap-1 text-sm'>
                プロフィール画像 1
                <input type='file' name='profileImage' className='rounded-xl border border-slate-200 px-3 py-2' />
              </label>
              <label className='grid gap-1 text-sm'>
                プロフィール画像 2
                <input type='file' name='profileImage2' className='rounded-xl border border-slate-200 px-3 py-2' />
              </label>
              <label className='grid gap-1 text-sm'>
                プロフィール画像 3
                <input type='file' name='profileImage3' className='rounded-xl border border-slate-200 px-3 py-2' />
              </label>
            </article>

            <div className='mt-2 flex items-center gap-2'>
              <button
                type='button'
                disabled={!canGoPrev}
                onClick={() => setStepIndex((prev) => Math.max(0, Math.min(prev, steps.length - 1) - 1))}
                className='h-11 flex-1 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50'
              >
                戻る
              </button>
              {canGoNext ? (
                <button
                  type='button'
                  onClick={() => setStepIndex((prev) => Math.min(steps.length - 1, Math.min(prev, steps.length - 1) + 1))}
                  className='h-11 flex-1 rounded-2xl bg-slate-900 text-sm font-semibold text-white'
                >
                  次へ
                </button>
              ) : (
                <button type='submit' className='h-11 flex-1 rounded-2xl bg-slate-900 text-sm font-semibold text-white'>
                  登録を完了する
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
