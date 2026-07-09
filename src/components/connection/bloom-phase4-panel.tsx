import { BloomHistoryCard } from '@/components/connection/bloom-history-card';
import { BloomMemoriesList } from '@/components/connection/bloom-memory-form';
import { BloomReflectionCard } from '@/components/connection/bloom-reflection-card';
import { BloomTimelineCard } from '@/components/connection/bloom-timeline-card';
import { updatePhase4VisibilityAction } from '@/lib/connection/bloom-phase4-actions';
import { PROFILE_TIMELINE_DESCRIPTION, PROFILE_TIMELINE_TITLE } from '@/lib/connection/bloom-ui-labels';
import type {
  BloomMemory,
  BloomTimelineEntry,
  BloomVersion,
} from '@/lib/connection/bloom-phase4-types';

const GOLD = '#b8956a';

type Settings = {
  showTimeline: boolean;
  showMemories: boolean;
  showReflection: boolean;
};

type OwnerProps = {
  mode: 'owner';
  timeline: BloomTimelineEntry[];
  memories: BloomMemory[];
  versions: BloomVersion[];
  aiReflection: string;
  settings: Settings;
  aiEnabled: boolean;
};

type PublicProps = {
  mode: 'public';
  timeline?: BloomTimelineEntry[];
  memories?: BloomMemory[];
  aiReflection?: string;
};

type AdminProps = {
  mode: 'admin';
  timeline: BloomTimelineEntry[];
  memories: BloomMemory[];
  versions: BloomVersion[];
  aiReflection: string;
};

type Props = OwnerProps | PublicProps | AdminProps;

function SectionShell({
  kicker,
  title,
  description,
  id,
  children,
}: {
  kicker: string;
  title: string;
  description?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className='scroll-mt-24 space-y-3'>
      <div className='space-y-1'>
        <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
          {kicker}
        </p>
        <h2 className='text-lg font-semibold tracking-tight text-[#1a1a1a]'>{title}</h2>
        {description ? <p className='text-sm leading-7 text-[#6b6b6b]'>{description}</p> : null}
      </div>
      <div className='rounded-3xl border border-[#ebe9e4] bg-white px-6 py-4'>{children}</div>
    </section>
  );
}

export function BloomPhase4Panel(props: Props) {
  if (props.mode === 'owner') {
    const { timeline, memories, versions, aiReflection, settings, aiEnabled } = props;
    return (
      <div className='space-y-10'>
        <SectionShell
          id='profile-section-timeline'
          kicker='RECORD'
          title={PROFILE_TIMELINE_TITLE}
          description={PROFILE_TIMELINE_DESCRIPTION}
        >
          <BloomTimelineCard entries={timeline} mode='owner' />
        </SectionShell>

        <SectionShell kicker='MEMORIES' title='思い出のメモ'>
          <BloomMemoriesList memories={memories} mode='owner' />
        </SectionShell>

        <SectionShell kicker='HISTORY' title='紹介の履歴'>
          <BloomHistoryCard versions={versions} mode='owner' />
        </SectionShell>

        <SectionShell kicker='REFLECTION' title='最近のあなた'>
          <BloomReflectionCard reflection={aiReflection} aiEnabled={aiEnabled} mode='owner' />
        </SectionShell>

        <form
          action={updatePhase4VisibilityAction}
          className='space-y-2 rounded-2xl border border-[#ebe9e4] bg-[#fafaf8] p-4'
        >
          <p className='text-xs font-semibold text-[#4a4a4a]'>記録の公開設定</p>
          <label className='flex items-center gap-2 text-xs text-[#6b6b6b]'>
            <input type='checkbox' name='showTimeline' value='1' defaultChecked={settings.showTimeline} className='rounded' />
            あなたの記録を公開
          </label>
          <label className='flex items-center gap-2 text-xs text-[#6b6b6b]'>
            <input type='checkbox' name='showMemories' value='1' defaultChecked={settings.showMemories} className='rounded' />
            思い出のメモを公開
          </label>
          <label className='flex items-center gap-2 text-xs text-[#6b6b6b]'>
            <input
              type='checkbox'
              name='showReflection'
              value='1'
              defaultChecked={settings.showReflection}
              className='rounded'
            />
            最近のあなたを公開
          </label>
          <button
            type='submit'
            className='mt-2 rounded-full border border-[#d8d6d1] px-4 py-2 text-xs font-medium text-[#4a4a4a]'
          >
            公開設定を保存
          </button>
        </form>
      </div>
    );
  }

  if (props.mode === 'admin') {
    const { timeline, memories, versions, aiReflection } = props;
    return (
      <div className='space-y-6'>
        <div>
          <h3 className='mb-2 text-xs font-semibold text-[#6b6b6b]'>Bloom Timeline（閲覧のみ）</h3>
          <BloomTimelineCard entries={timeline} mode='admin' />
        </div>
        <div>
          <h3 className='mb-2 text-xs font-semibold text-[#6b6b6b]'>Bloom Memories（閲覧のみ）</h3>
          <BloomMemoriesList memories={memories} mode='admin' />
        </div>
        <div>
          <h3 className='mb-2 text-xs font-semibold text-[#6b6b6b]'>Bloom History（閲覧のみ）</h3>
          <BloomHistoryCard versions={versions} mode='admin' />
        </div>
        <div>
          <h3 className='mb-2 text-xs font-semibold text-[#6b6b6b]'>AI Reflection（閲覧のみ）</h3>
          <BloomReflectionCard reflection={aiReflection} aiEnabled={false} mode='admin' />
        </div>
      </div>
    );
  }

  const { timeline, memories, aiReflection } = props;
  const hasTimeline = timeline && timeline.length > 0;
  const hasMemories = memories && memories.length > 0;
  const hasReflection = aiReflection && aiReflection.trim();

  if (!hasTimeline && !hasMemories && !hasReflection) return null;

  return (
    <div className='space-y-4'>
      {hasTimeline ? (
        <div className='rounded-2xl border border-[#ebe9e4] bg-white p-5'>
          <h2 className='mb-1 text-sm font-semibold text-[#1a1a1a]'>{PROFILE_TIMELINE_TITLE}</h2>
          <p className='mb-3 text-xs leading-6 text-[#6b6b6b]'>{PROFILE_TIMELINE_DESCRIPTION}</p>
          <BloomTimelineCard entries={timeline!} mode='public' />
        </div>
      ) : null}
      {hasMemories ? (
        <div className='rounded-2xl border border-[#ebe9e4] bg-white p-5'>
          <h2 className='mb-3 text-sm font-semibold text-[#1a1a1a]'>思い出のメモ</h2>
          <BloomMemoriesList memories={memories!} mode='public' />
        </div>
      ) : null}
      {hasReflection ? (
        <div className='rounded-2xl border border-[#ebe9e4] bg-white p-5'>
          <h2 className='mb-2 text-sm font-semibold text-[#1a1a1a]'>最近のあなた</h2>
          <BloomReflectionCard reflection={aiReflection!} aiEnabled={false} mode='public' />
        </div>
      ) : null}
    </div>
  );
}
