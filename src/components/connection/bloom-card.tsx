import type { BloomProfile, PublicBloomProfile } from '@/lib/connection/bloom-profile-types';
import { BLOOM_SECTION_LABELS } from '@/lib/connection/bloom-ui-labels';

type BloomCardProps = {
  profile: BloomProfile | PublicBloomProfile;
  mode: 'owner' | 'public';
  className?: string;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className='border-b border-[#f1efe9] py-4 last:border-b-0'>
      <p className='mb-2 text-xs font-medium tracking-wide text-[#9a9a9a]'>{title}</p>
      {children}
    </div>
  );
}

function EmptyHint() {
  return <p className='text-sm text-[#c4c0b8]'>まだ生成されていません</p>;
}

export function BloomCard({ profile, mode, className = '' }: BloomCardProps) {
  const isOwner = mode === 'owner';
  const full = profile as BloomProfile;

  const hasContent =
    profile.aiIntroduction ||
    profile.bloomSummary ||
    (profile.conversationStarters && profile.conversationStarters.length > 0) ||
    profile.connectionStyle ||
    (profile.aiTags && profile.aiTags.length > 0) ||
    (isOwner && full.talkTopics && full.talkTopics.length > 0);

  if (!hasContent && !isOwner) return null;

  return (
    <div className={`rounded-2xl border border-[#ebe9e4] bg-white p-5 ${className}`}>
      <div className='mb-4 flex items-center gap-2'>
        <span className='text-lg' aria-hidden>
          🌸
        </span>
        <h2 className='text-sm font-semibold text-[#1a1a1a]'>あなたの紹介</h2>
      </div>

      {!hasContent ? (
        <EmptyHint />
      ) : (
        <div>
          {profile.bloomSummaryTitle || profile.bloomSummary ? (
            <Section title={BLOOM_SECTION_LABELS.summary}>
              {profile.bloomSummaryTitle ? (
                <p className='text-sm font-semibold text-[#1f5d4f]'>{profile.bloomSummaryTitle}</p>
              ) : null}
              {profile.bloomSummary ? (
                <p className='mt-1 text-sm leading-7 text-[#4a4a4a]'>{profile.bloomSummary}</p>
              ) : null}
            </Section>
          ) : null}

          {isOwner && profile.aiIntroduction ? (
            <Section title={BLOOM_SECTION_LABELS.aiIntro}>
              <p className='whitespace-pre-wrap text-sm leading-7 text-[#3a3a3a]'>{profile.aiIntroduction}</p>
            </Section>
          ) : null}

          {!isOwner && profile.aiIntroduction ? (
            <Section title={BLOOM_SECTION_LABELS.aiIntro}>
              <p className='whitespace-pre-wrap text-sm leading-7 text-[#3a3a3a]'>{profile.aiIntroduction}</p>
            </Section>
          ) : null}

          {profile.conversationStarters && profile.conversationStarters.length > 0 ? (
            <Section title={BLOOM_SECTION_LABELS.conversationStarters}>
              <ul className='space-y-1.5'>
                {profile.conversationStarters.map((starter) => (
                  <li key={starter} className='text-sm text-[#4a4a4a]'>
                    ・{starter}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {profile.aiTags && profile.aiTags.length > 0 ? (
            <Section title={BLOOM_SECTION_LABELS.tags}>
              <div className='flex flex-wrap gap-1.5'>
                {profile.aiTags.map((tag) => (
                  <span
                    key={tag}
                    className='rounded-full border border-[#ebe9e4] bg-[#f7f6f2] px-2.5 py-0.5 text-[11px] text-[#4a4a4a]'
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Section>
          ) : null}

          {profile.connectionStyle ? (
            <Section title={BLOOM_SECTION_LABELS.connectionStyle}>
              <p className='text-sm leading-7 text-[#4a4a4a]'>{profile.connectionStyle}</p>
            </Section>
          ) : null}

          {isOwner && full.talkTopics && full.talkTopics.length > 0 ? (
            <Section title='この人と話すなら'>
              <p className='mb-2 text-[11px] text-[#9a9a9a]'>こんな話題が自然です（本人のみ表示）</p>
              <ul className='space-y-1.5'>
                {full.talkTopics.map((topic) => (
                  <li key={topic} className='text-sm text-[#4a4a4a]'>
                    ・{topic}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function BloomCardOwner({ profile }: { profile: BloomProfile }) {
  return <BloomCard profile={profile} mode='owner' />;
}

export function BloomCardPublic({ profile }: { profile: PublicBloomProfile }) {
  return <BloomCard profile={profile} mode='public' />;
}
