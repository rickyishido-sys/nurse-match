import { Chip } from '@/components/connection/ui';
import { TrustBadgeList } from '@/components/connection/trust-badge';
import {
  INTEREST_TAG_LABEL,
  LIFE_PHASE_LABEL,
  PERSONALITY_TYPE_META,
  PURPOSE_LABEL,
  VALUE_TAG_LABEL,
  formatPersonalityAxes,
} from '@/lib/connection/data';
import type { ConnectionMember } from '@/lib/connection/types';

type MemberInsightsProps = {
  member: ConnectionMember;
  variant?: 'compact' | 'full';
};

/** 価値観・目的・興味・人生フェーズ・性格タイプを表示（管理画面・Connectionページ共用） */
export function MemberInsights({ member, variant = 'compact' }: MemberInsightsProps) {
  const showValues = variant === 'full';

  return (
    <div className='space-y-3'>
      {variant === 'compact' ? <TrustBadgeList member={member} /> : null}

      <div className='flex flex-wrap gap-1'>
        <Chip tone='accent'>{LIFE_PHASE_LABEL[member.lifePhase]}</Chip>
        {member.personality ? (
          <Chip tone='muted'>{PERSONALITY_TYPE_META[member.personality.type].label}</Chip>
        ) : (
          <Chip tone='muted'>性格診断未受検</Chip>
        )}
      </div>

      {member.personality ? (
        <p className='text-[11px] text-[#9a9a9a]'>{formatPersonalityAxes(member.personality.axes)}</p>
      ) : null}

      <div>
        <p className='mb-1 text-[11px] font-medium text-[#6b6b6b]'>Connection目的</p>
        <div className='flex flex-wrap gap-1'>
          {member.purposes.map((p) => (
            <Chip key={p} tone='muted'>{PURPOSE_LABEL[p]}</Chip>
          ))}
        </div>
      </div>

      <div>
        <p className='mb-1 text-[11px] font-medium text-[#6b6b6b]'>興味関心</p>
        <div className='flex flex-wrap gap-1'>
          {member.interestTags.map((t) => (
            <Chip key={t} tone='muted'>{INTEREST_TAG_LABEL[t]}</Chip>
          ))}
        </div>
      </div>

      {member.values.valueTags && member.values.valueTags.length > 0 ? (
        <div>
          <p className='mb-1 text-[11px] font-medium text-[#6b6b6b]'>価値観</p>
          <div className='flex flex-wrap gap-1'>
            {member.values.valueTags.map((t) => (
              <Chip key={t} tone='neutral'>{VALUE_TAG_LABEL[t]}</Chip>
            ))}
          </div>
        </div>
      ) : null}

      {showValues ? (
        <div className='space-y-2 border-t border-[#ebe9e4] pt-3'>
          <ValueRow label='今一番大切にしていること' value={member.values.mostImportant} />
          <ValueRow label='最近挑戦していること' value={member.values.currentChallenge} />
          <ValueRow label='今後やってみたいこと' value={member.values.futureGoal} />
          <ValueRow label='最近感動したこと' value={member.values.recentInspiration} />
          <ValueRow label='人から言われること' value={member.values.howOthersSeeMe} />
          <ValueRow label='性格を一言で' value={member.values.personalityOneWord} />
          <ValueRow label='大切にしている価値観' value={member.values.coreValues} />
        </div>
      ) : null}
    </div>
  );
}

function ValueRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <p className='text-[10px] text-[#9a9a9a]'>{label}</p>
      <p className='text-xs leading-5 text-[#4a4a4a]'>{value}</p>
    </div>
  );
}
