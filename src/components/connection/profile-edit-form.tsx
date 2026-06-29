'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { updateMyProfileAction } from '@/lib/connection/actions';
import { ProfilePhotoUploader } from '@/components/connection/profile-photo-uploader';
import { INTEREST_TAG_OPTIONS, LIFE_PHASE_OPTIONS } from '@/lib/connection/data';
import {
  DESIRED_CONNECTION_OPTIONS,
  PREFECTURES,
  TEMPERAMENT_OPTIONS,
} from '@/lib/connection/onboarding-options';
import type {
  ConnectionMember,
  ConnectionPurpose,
  InterestTag,
  LifePhase,
} from '@/lib/connection/types';

const GOLD = '#b8956a';
const ACCENT = '#1f5d4f';

const GENDER_OPTIONS = [
  { value: 'female', label: '女性' },
  { value: 'male', label: '男性' },
  { value: 'other', label: 'その他 / 未回答' },
] as const;

const fieldClass =
  'w-full rounded-2xl border border-[#ebe9e4] bg-[#faf9f6] px-4 py-3 text-sm text-[#1a1a1a] outline-none transition focus:border-[#1f5d4f] focus:ring-1 focus:ring-[#1f5d4f]/20';

function SectionCard({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className='space-y-4'>
      <div className='space-y-1'>
        <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
          {kicker}
        </p>
        <h2 className='text-lg font-semibold tracking-tight text-[#1a1a1a]'>{title}</h2>
      </div>
      <div className='rounded-3xl border border-[#ebe9e4] bg-white px-6 py-5'>{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className='mb-2 block text-xs font-medium tracking-wide text-[#9a9a9a]'>{children}</label>;
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-[13px] font-medium transition ${
        active
          ? 'border-[#1f5d4f] bg-[#eef3ef] text-[#1f5d4f]'
          : 'border-[#e7e2d8] bg-[#fbf9f5] text-[#3a4742] hover:border-[#d8d4cc]'
      }`}
    >
      {children}
    </button>
  );
}

function toggleItem<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function initialTemperament(member: ConnectionMember): string {
  if (!member.personality) return '';
  const match = TEMPERAMENT_OPTIONS.find(
    (o) =>
      o.type === member.personality!.type &&
      o.axes.energy === member.personality!.axes.energy &&
      o.axes.thinking === member.personality!.axes.thinking &&
      o.axes.planning === member.personality!.axes.planning,
  );
  return match?.value ?? '';
}

type ProfileEditFormProps = {
  member: ConnectionMember;
  error?: string;
};

export function ProfileEditForm({ member, error }: ProfileEditFormProps) {
  const [purposes, setPurposes] = useState<ConnectionPurpose[]>(member.purposes);
  const [interestTags, setInterestTags] = useState<InterestTag[]>(member.interestTags);
  const [gender, setGender] = useState(member.gender);
  const [lifePhase, setLifePhase] = useState<LifePhase>(member.lifePhase);
  const [temperament, setTemperament] = useState(initialTemperament(member));
  const [area, setArea] = useState(member.area);

  const purposeFields = useMemo(
    () => purposes.map((p) => <input key={p} type='hidden' name='purposes' value={p} />),
    [purposes],
  );
  const interestFields = useMemo(
    () => interestTags.map((t) => <input key={t} type='hidden' name='interestTags' value={t} />),
    [interestTags],
  );

  return (
    <form action={updateMyProfileAction} className='space-y-10'>
      {error === 'nickname' ? (
        <p className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
          表示名を入力してください。
        </p>
      ) : null}

      <SectionCard kicker='PHOTOS' title='プロフィール写真'>
        <p className='mb-4 text-xs leading-6 text-[#6b6b6b]'>
          最大6枚まで。1枚目がメインプロフィールになります。
        </p>
        <ProfilePhotoUploader initialPhotos={member.photos} />
      </SectionCard>

      <SectionCard kicker='BASIC' title='基本情報'>
        <div className='space-y-5'>
          <div>
            <FieldLabel>表示名</FieldLabel>
            <input
              name='nickname'
              defaultValue={member.nickname}
              maxLength={20}
              required
              className={fieldClass}
              placeholder='例：Ricky'
            />
          </div>
          <div>
            <FieldLabel>年齢</FieldLabel>
            <input
              name='age'
              type='number'
              min={18}
              max={99}
              defaultValue={member.age || ''}
              required
              className={fieldClass}
            />
          </div>
          <div>
            <FieldLabel>性別</FieldLabel>
            <input type='hidden' name='gender' value={gender} />
            <div className='flex flex-wrap gap-2'>
              {GENDER_OPTIONS.map((opt) => (
                <ChipButton key={opt.value} active={gender === opt.value} onClick={() => setGender(opt.value)}>
                  {opt.label}
                </ChipButton>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>居住エリア</FieldLabel>
            <select name='area' value={area} onChange={(e) => setArea(e.target.value)} required className={fieldClass}>
              <option value=''>選択してください</option>
              {PREFECTURES.map((pref) => (
                <option key={pref} value={pref}>
                  {pref}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>ライフフェーズ</FieldLabel>
            <input type='hidden' name='lifePhase' value={lifePhase} />
            <div className='flex flex-wrap gap-2'>
              {LIFE_PHASE_OPTIONS.map(([value, label]) => (
                <ChipButton key={value} active={lifePhase === value} onClick={() => setLifePhase(value)}>
                  {label}
                </ChipButton>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard kicker='CONNECTION' title='Connection情報'>
        <div className='space-y-6'>
          <div>
            <FieldLabel>Connectionの目的</FieldLabel>
            {purposeFields}
            <div className='flex flex-wrap gap-2'>
              {DESIRED_CONNECTION_OPTIONS.map((opt) => (
                <ChipButton
                  key={opt.value}
                  active={purposes.includes(opt.value)}
                  onClick={() => setPurposes((prev) => toggleItem(prev, opt.value))}
                >
                  {opt.label}
                </ChipButton>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>興味・関心</FieldLabel>
            {interestFields}
            <div className='flex flex-wrap gap-2'>
              {INTEREST_TAG_OPTIONS.map(([value, label]) => (
                <ChipButton
                  key={value}
                  active={interestTags.includes(value)}
                  onClick={() => setInterestTags((prev) => toggleItem(prev, value))}
                >
                  {label}
                </ChipButton>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>性格タイプ</FieldLabel>
            <input type='hidden' name='temperament' value={temperament} />
            <div className='flex flex-wrap gap-2'>
              {TEMPERAMENT_OPTIONS.map((opt) => (
                <ChipButton
                  key={opt.value}
                  active={temperament === opt.value}
                  onClick={() => setTemperament(opt.value)}
                >
                  {opt.label}
                </ChipButton>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>自己紹介</FieldLabel>
            <textarea
              name='bio'
              rows={5}
              defaultValue={member.bio}
              placeholder='あなたについて、自由に書いてください。'
              className={`${fieldClass} resize-none leading-7`}
            />
          </div>
        </div>
      </SectionCard>

      <div className='flex flex-col gap-3 sm:flex-row'>
        <button
          type='submit'
          className='flex h-[52px] flex-1 items-center justify-center rounded-full text-sm font-semibold text-white transition active:scale-[0.99]'
          style={{ backgroundColor: ACCENT }}
        >
          保存する
        </button>
        <Link
          href='/my-profile'
          className='flex h-[52px] flex-1 items-center justify-center rounded-full border border-[#d8d6d1] text-sm font-semibold text-[#6b6b6b] transition active:scale-[0.99]'
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
