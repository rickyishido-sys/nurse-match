import Image from 'next/image';
import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getMember } from '@/lib/connection/repo';
import {
  INTEREST_TAG_LABEL,
  LIFE_PHASE_LABEL,
  PURPOSE_LABEL,
  PERSONALITY_TYPE_META,
} from '@/lib/connection/data';
import type { ConnectionMember } from '@/lib/connection/types';

const GOLD = '#b8956a';

const GENDER_LABEL: Record<ConnectionMember['gender'], string> = {
  female: '女性',
  male: '男性',
  other: 'その他 / 未回答',
};

function EmptyProfile({ viewer }: { viewer: Awaited<ReturnType<typeof getHanakaiViewer>> }) {
  return (
    <ConnectionShell viewer={viewer}>
      <div className='flex min-h-[60vh] flex-col items-center justify-center text-center'>
        <div
          className='mb-6 flex h-24 w-24 items-center justify-center rounded-[28px]'
          style={{ background: 'radial-gradient(circle at 50% 36%, #f8eef0 0%, #f0e2e4 74%)' }}
        >
          <div className='relative h-14 w-14'>
            <Image src='/categories/flower.png' alt='' fill sizes='56px' className='object-contain' />
          </div>
        </div>
        <h1 className='font-sans text-xl font-semibold tracking-tight text-[#1a1a1a]'>
          プロフィールがまだ登録されていません
        </h1>
        <p className='mx-auto mt-3 max-w-sm text-sm leading-7 text-[#6b6b6b]'>
          あなたの価値観や興味を登録すると、運営があなたに合うConnectionを設計します。
        </p>
        <Link
          href='/register/profile'
          className='mt-7 inline-flex h-12 items-center justify-center rounded-full bg-[#1f5d4f] px-8 text-sm font-semibold text-white transition active:scale-[0.98]'
        >
          プロフィールを作成する
        </Link>
      </div>
    </ConnectionShell>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className='flex items-baseline justify-between gap-4 border-b border-[#f1efe9] py-3.5 last:border-b-0'>
      <span className='shrink-0 text-xs font-medium tracking-wide text-[#9a9a9a]'>{label}</span>
      <span className='min-w-0 text-right text-sm font-medium text-[#1a1a1a]'>
        {value && value.trim() ? value : <span className='text-[#c4c0b8]'>未登録</span>}
      </span>
    </div>
  );
}

function TagBlock({ label, tags }: { label: string; tags: string[] }) {
  return (
    <div className='border-b border-[#f1efe9] py-4 last:border-b-0'>
      <p className='mb-2.5 text-xs font-medium tracking-wide text-[#9a9a9a]'>{label}</p>
      {tags.length > 0 ? (
        <div className='flex flex-wrap gap-2'>
          {tags.map((t) => (
            <span
              key={t}
              className='inline-flex items-center rounded-full border border-[#e7e2d8] bg-[#fbf9f5] px-3 py-1 text-[13px] font-medium text-[#3a4742]'
            >
              {t}
            </span>
          ))}
        </div>
      ) : (
        <p className='text-sm text-[#c4c0b8]'>未登録</p>
      )}
    </div>
  );
}

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
      <div className='rounded-3xl border border-[#ebe9e4] bg-white px-6 py-3'>{children}</div>
    </section>
  );
}

export default async function MyProfilePage() {
  const viewer = await getHanakaiViewer();
  const viewerMemberId = await getViewerMemberId();
  const member = viewerMemberId ? await getMember(viewerMemberId) : null;

  if (!member || !member.nickname.trim()) {
    return <EmptyProfile viewer={viewer} />;
  }

  const personality = member.personality ? PERSONALITY_TYPE_META[member.personality.type] : null;
  const purposeLabels = member.purposes.map((p) => PURPOSE_LABEL[p]).filter(Boolean);
  const interestLabels = member.interestTags.map((t) => INTEREST_TAG_LABEL[t]).filter(Boolean);

  return (
    <ConnectionShell viewer={viewer}>
      <div className='space-y-12'>
        {/* ヘッダー */}
        <section className='flex items-center gap-5'>
          <div className='relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-1 ring-[#ebe9e4]'>
            {member.avatarUrl ? (
              <Image src={member.avatarUrl} alt={member.nickname} fill className='object-cover' />
            ) : (
              <div
                className='flex h-full w-full items-center justify-center text-2xl font-semibold text-[#1f5d4f]'
                style={{ background: 'radial-gradient(circle at 50% 36%, #eef3ef 0%, #e4ecdd 74%)' }}
              >
                {member.nickname.charAt(0)}
              </div>
            )}
          </div>
          <div className='min-w-0 space-y-1.5'>
            <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
              MY PROFILE
            </p>
            <h1 className='truncate text-[1.5rem] font-semibold leading-tight tracking-tight text-[#1a1a1a]'>
              {member.nickname}
            </h1>
            <p className='text-xs text-[#6b6b6b]'>
              {member.age ? `${member.age}歳` : ''}
              {member.area ? ` · ${member.area}` : ''}
            </p>
          </div>
        </section>

        {/* 基本情報 */}
        <SectionCard kicker='BASIC' title='基本情報'>
          <Field label='表示名' value={member.nickname} />
          <Field label='年齢' value={member.age ? `${member.age}歳` : ''} />
          <Field label='性別' value={GENDER_LABEL[member.gender]} />
          <Field label='居住エリア' value={member.area} />
          <Field label='ライフフェーズ' value={LIFE_PHASE_LABEL[member.lifePhase]} />
        </SectionCard>

        {/* Connection情報 */}
        <SectionCard kicker='CONNECTION' title='Connection情報'>
          <TagBlock label='Connectionの目的' tags={purposeLabels} />
          <TagBlock label='興味・関心' tags={interestLabels} />
          <div className='border-b border-[#f1efe9] py-4 last:border-b-0'>
            <p className='mb-2 text-xs font-medium tracking-wide text-[#9a9a9a]'>性格タイプ</p>
            {personality ? (
              <div>
                <p className='text-sm font-semibold text-[#1f5d4f]'>{personality.label}</p>
                <p className='mt-1 text-xs leading-6 text-[#6b6b6b]'>{personality.description}</p>
              </div>
            ) : (
              <p className='text-sm text-[#c4c0b8]'>未登録</p>
            )}
          </div>
          <div className='py-4'>
            <p className='mb-2 text-xs font-medium tracking-wide text-[#9a9a9a]'>自己紹介</p>
            {member.bio.trim() ? (
              <p className='text-sm leading-7 text-[#3a3a3a]'>{member.bio}</p>
            ) : (
              <p className='text-sm text-[#c4c0b8]'>未登録</p>
            )}
          </div>
        </SectionCard>

        {/* 編集 */}
        <Link
          href='/register/profile'
          className='flex h-13 items-center justify-center rounded-full bg-[#1f5d4f] text-sm font-semibold text-white transition active:scale-[0.99]'
          style={{ height: 52 }}
        >
          プロフィールを編集する
        </Link>
      </div>
    </ConnectionShell>
  );
}
