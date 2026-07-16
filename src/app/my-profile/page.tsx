import Image from 'next/image';
import Link from 'next/link';
import { ConnectionShell } from '@/components/connection/shell';
import { ProfileHeader } from '@/components/connection/profile-header';
import { ProfilePhotoSection } from '@/components/connection/profile-photo-section';
import { IdentityVerificationSection } from '@/components/connection/identity-verification-section';
import { ProfileEditForm } from '@/components/connection/profile-edit-form';
import { LegalLinks } from '@/components/connection/legal-links';
import { TrustBadgeList } from '@/components/connection/trust-badge';
import { BloomCardOwner } from '@/components/connection/bloom-card';
import { BloomPhase4Panel } from '@/components/connection/bloom-phase4-panel';
import { BloomProfileUpdateButton, BloomVisibilityForm } from '@/components/connection/bloom-profile-panel';
import { ProfileCompletionCard } from '@/components/connection/profile/profile-completion-card';
import { ProfileNextRecommendationCard } from '@/components/connection/profile/profile-next-recommendation';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import { isBloomAiEnabled } from '@/lib/connection/bloom-profile-ai';
import { getBloomProfileOrEmpty } from '@/lib/connection/bloom-profile';
import {
  getBloomPhase4Settings,
  listBloomMemories,
  listBloomTimeline,
  listBloomVersions,
} from '@/lib/connection/bloom-phase4';
import { MBTI_LABEL } from '@/lib/connection/bloom-profile-options';
import { getViewerMemberId } from '@/lib/connection/identity';
import { getMember } from '@/lib/connection/repo';
import { getPublicTrustBadges } from '@/lib/connection/trust';
import {
  computeProfileCompletion,
  resolveProfileNextRecommendation,
  PROFILE_SECTION_IDS,
} from '@/lib/connection/profile-completion';
import { memberHasEventParticipation } from '@/lib/connection/profile-completion-server';
import {
  INTEREST_TAG_LABEL,
  LIFE_PHASE_LABEL,
  PURPOSE_LABEL,
  PERSONALITY_TYPE_META,
  VALUE_TAG_LABEL,
} from '@/lib/connection/data';
import type { ConnectionMember, ValueTag } from '@/lib/connection/types';

const GOLD = '#b8956a';

const GENDER_LABEL: Record<ConnectionMember['gender'], string> = {
  female: '女性',
  male: '男性',
  other: 'その他 / 未回答',
};

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function param(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

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
          あなたの価値観や興味を登録すると、運営があなたに合う体験を設計します。
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

function TagBlock({ label, id, tags }: { label: string; id?: string; tags: string[] }) {
  return (
    <div id={id} className='scroll-mt-24 border-b border-[#f1efe9] py-4 last:border-b-0'>
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
  id,
  children,
}: {
  kicker: string;
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className='scroll-mt-24 space-y-4'>
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

function ValuesBlock({ member }: { member: ConnectionMember }) {
  const valueTagLabels = (member.values.valueTags ?? []).map((t) => VALUE_TAG_LABEL[t as ValueTag] ?? t);
  const rows = [
    { label: 'いま大切にしていること', value: member.values.mostImportant },
    { label: 'いまの課題', value: member.values.currentChallenge },
    { label: 'これから叶えたいこと', value: member.values.futureGoal },
    { label: '大切にしている価値観', value: member.values.coreValues },
  ].filter((r) => r.value?.trim());

  const hasContent = valueTagLabels.length > 0 || rows.length > 0;

  return (
    <div id={PROFILE_SECTION_IDS.values} className='scroll-mt-24 space-y-4'>
      {valueTagLabels.length > 0 ? (
        <div className='flex flex-wrap gap-2'>
          {valueTagLabels.map((t) => (
            <span
              key={t}
              className='inline-flex items-center rounded-full border border-[#e7e2d8] bg-[#fbf9f5] px-3 py-1 text-[13px] font-medium text-[#3a4742]'
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
      {rows.map((row) => (
        <div key={row.label}>
          <p className='mb-1 text-xs font-medium tracking-wide text-[#9a9a9a]'>{row.label}</p>
          <p className='text-sm leading-7 text-[#3a3a3a]'>{row.value}</p>
        </div>
      ))}
      {!hasContent ? <p className='text-sm text-[#c4c0b8]'>未登録</p> : null}
    </div>
  );
}

export default async function MyProfilePage({ searchParams }: PageProps) {
  const viewer = await getHanakaiViewer();
  const sp = searchParams ? await searchParams : {};
  const mode = param(sp, 'mode');
  const isEditMode = mode === 'edit';
  const profileSaved = param(sp, 'saved') === '1';
  const identitySubmitted = param(sp, 'identity') === 'submitted';
  const photosSaved = param(sp, 'photos') === 'saved';
  const editError = param(sp, 'error');
  const viewerMemberId = await getViewerMemberId();
  const member = viewerMemberId ? await getMember(viewerMemberId) : null;
  const bloomProfile = viewerMemberId ? await getBloomProfileOrEmpty(viewerMemberId) : null;
  const bloomSaved = param(sp, 'bloomSaved') === '1';
  const phase4Saved = param(sp, 'phase4Saved') === '1';
  const memorySaved = param(sp, 'memorySaved') === '1';
  const reflectionUpdated = param(sp, 'reflectionUpdated') === '1';
  const phase4Settings = viewerMemberId ? await getBloomPhase4Settings(viewerMemberId) : null;
  const bloomTimeline = viewerMemberId ? await listBloomTimeline(viewerMemberId) : [];
  const bloomMemories = viewerMemberId ? await listBloomMemories(viewerMemberId) : [];
  const bloomVersions = viewerMemberId ? await listBloomVersions(viewerMemberId) : [];

  if (!member || !member.nickname.trim()) {
    return <EmptyProfile viewer={viewer} />;
  }

  if (isEditMode) {
    return (
      <ConnectionShell viewer={viewer}>
        <div className='space-y-8'>
          <section className='space-y-1.5'>
            <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
              マイプロフィール
            </p>
            <h1 className='text-[1.5rem] font-semibold leading-tight tracking-tight text-[#1a1a1a]'>
              プロフィールを編集
            </h1>
            <p className='text-sm leading-7 text-[#6b6b6b]'>
              内容を変更したら「保存する」を押してください。
            </p>
          </section>
          <ProfileEditForm member={member} error={editError} aiEnabled={isBloomAiEnabled()} />
        </div>
      </ConnectionShell>
    );
  }

  const personality = member.personality ? PERSONALITY_TYPE_META[member.personality.type] : null;
  const purposeLabels = member.purposes.map((p) => PURPOSE_LABEL[p]).filter(Boolean);
  const interestLabels = member.interestTags.map((t) => INTEREST_TAG_LABEL[t]).filter(Boolean);
  const mbtiLabel =
    member.mbtiType && member.mbtiType !== 'unknown'
      ? (MBTI_LABEL[member.mbtiType] ?? member.mbtiType)
      : '';

  const completion = computeProfileCompletion(member, bloomProfile);
  const hasEventParticipation = viewerMemberId ? await memberHasEventParticipation(viewerMemberId) : false;
  const nextRecommendation = resolveProfileNextRecommendation({
    member,
    bloomProfile,
    hasEventParticipation,
  });

  return (
    <ConnectionShell viewer={viewer}>
      <div className='space-y-12'>
        {profileSaved ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-sm text-[#1f5d4f]'>
            プロフィールを更新しました
          </p>
        ) : null}
        {identitySubmitted ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-sm text-[#1f5d4f]'>
            本人確認書類を受け付けました。審査完了までしばらくお待ちください。
          </p>
        ) : null}
        {photosSaved ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-sm text-[#1f5d4f]'>
            プロフィール写真を保存しました。
          </p>
        ) : null}
        {bloomSaved ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-sm text-[#1f5d4f]'>
            公開設定を保存しました
          </p>
        ) : null}
        {phase4Saved ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-sm text-[#1f5d4f]'>
            記録の公開設定を保存しました
          </p>
        ) : null}
        {memorySaved ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-sm text-[#1f5d4f]'>
            思い出のメモを保存しました
          </p>
        ) : null}
        {reflectionUpdated ? (
          <p className='rounded-2xl border border-[#cfe3da] bg-[#f3f7f5] px-4 py-3 text-sm text-[#1f5d4f]'>
            最近のあなたを更新しました
          </p>
        ) : null}

        <ProfileHeader
          member={member}
          viewerMemberId={viewerMemberId}
          kicker='マイプロフィール'
          editPhotoHref='/my-profile?mode=edit#profile-section-photos'
        />

        {getPublicTrustBadges(member).some((b) => b.key !== 'identity') ? (
          <TrustBadgeList member={member} hideIdentity />
        ) : null}

        <ProfileCompletionCard completion={completion} />

        <Link
          href='/events'
          className='flex h-[52px] items-center justify-center rounded-full border border-[#1f5d4f] bg-[#f7faf8] text-sm font-semibold text-[#1f5d4f] transition active:scale-[0.99]'
        >
          イベントを見る
        </Link>

        <SectionCard kicker='写真' title='プロフィール写真' id={PROFILE_SECTION_IDS.photos}>
          <ProfilePhotoSection member={member} />
        </SectionCard>

        <SectionCard kicker='基本' title='基本情報'>
          <Field label='表示名' value={member.nickname} />
          <Field label='年齢' value={member.age ? `${member.age}歳` : ''} />
          <Field label='性別' value={GENDER_LABEL[member.gender]} />
          <Field label='居住エリア' value={member.area} />
          <Field label='ライフフェーズ' value={LIFE_PHASE_LABEL[member.lifePhase]} />
        </SectionCard>

        <SectionCard kicker='つながり' title='参加について'>
          <TagBlock label='参加の目的' id={PROFILE_SECTION_IDS.purposes} tags={purposeLabels} />
          <TagBlock label='興味・関心' id={PROFILE_SECTION_IDS.interests} tags={interestLabels} />
          <div id={PROFILE_SECTION_IDS.personality} className='scroll-mt-24 border-b border-[#f1efe9] py-4 last:border-b-0'>
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
          <div id={PROFILE_SECTION_IDS.bio} className='scroll-mt-24 py-4'>
            <p className='mb-2 text-xs font-medium tracking-wide text-[#9a9a9a]'>自己紹介</p>
            {member.bio.trim() ? (
              <p className='text-sm leading-7 text-[#3a3a3a]'>{member.bio}</p>
            ) : (
              <p className='text-sm text-[#c4c0b8]'>未登録</p>
            )}
          </div>
          {mbtiLabel ? (
            <div className='border-b border-[#f1efe9] py-4 last:border-b-0'>
              <p className='mb-2 text-xs font-medium tracking-wide text-[#9a9a9a]'>性格診断タイプ</p>
              <p className='text-sm font-medium text-[#1a1a1a]'>{mbtiLabel}</p>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard kicker='価値観' title='あなたの価値観'>
          <ValuesBlock member={member} />
        </SectionCard>

        <SectionCard kicker='安心' title='本人確認' id={PROFILE_SECTION_IDS.identity}>
          <IdentityVerificationSection member={member} />
        </SectionCard>

        {bloomProfile ? (
          <section id={PROFILE_SECTION_IDS.intro} className='scroll-mt-24 space-y-4'>
            <div className='space-y-1'>
              <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
                紹介
              </p>
              <h2 className='text-lg font-semibold tracking-tight text-[#1a1a1a]'>あなたの紹介</h2>
              <p className='text-sm leading-7 text-[#6b6b6b]'>
                プロフィールをもとに整えた、あなたらしさの紹介です。
              </p>
            </div>
            <BloomCardOwner profile={bloomProfile} />
            <BloomProfileUpdateButton aiEnabled={isBloomAiEnabled()} hasProfile={completion.items.find((i) => i.id === 'intro')?.complete ?? false} />
            <BloomVisibilityForm profile={bloomProfile} />
          </section>
        ) : null}

        {phase4Settings ? (
          <BloomPhase4Panel
            mode='owner'
            timeline={bloomTimeline}
            memories={bloomMemories}
            versions={bloomVersions}
            aiReflection={phase4Settings.aiReflection}
            settings={{
              showTimeline: phase4Settings.showTimeline,
              showMemories: phase4Settings.showMemories,
              showReflection: phase4Settings.showReflection,
            }}
            aiEnabled={isBloomAiEnabled()}
          />
        ) : null}

        <Link
          href='/my-profile?mode=edit'
          className='flex h-13 items-center justify-center rounded-full bg-[#1f5d4f] text-sm font-semibold text-white transition active:scale-[0.99]'
          style={{ height: 52 }}
        >
          プロフィールを編集する
        </Link>

        <ProfileNextRecommendationCard recommendation={nextRecommendation} />

        <Link
          href='/account/delete'
          className='block text-center text-xs text-[#9a9a9a] underline-offset-2 hover:text-[#b42318] hover:underline'
        >
          アカウントを削除する
        </Link>

        <LegalLinks className='text-[#9a9a9a]' />
      </div>
    </ConnectionShell>
  );
}
