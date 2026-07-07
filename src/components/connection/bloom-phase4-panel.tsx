import { BloomHistoryCard } from '@/components/connection/bloom-history-card';
import { BloomMemoriesList } from '@/components/connection/bloom-memory-form';
import { BloomReflectionCard } from '@/components/connection/bloom-reflection-card';
import { BloomTimelineCard } from '@/components/connection/bloom-timeline-card';
import { updatePhase4VisibilityAction } from '@/lib/connection/bloom-phase4-actions';
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

function SectionShell({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section className='space-y-3'>
      <div className='space-y-1'>
        <p className='text-[11px] font-semibold tracking-[0.2em]' style={{ color: GOLD }}>
          {kicker}
        </p>
        <h2 className='text-lg font-semibold tracking-tight text-[#1a1a1a]'>{title}</h2>
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
        <SectionShell kicker='BLOOM' title='Bloom Timeline'>
          <BloomTimelineCard entries={timeline} mode='owner' />
        </SectionShell>

        <SectionShell kicker='BLOOM' title='Bloom Memories'>
          <BloomMemoriesList memories={memories} mode='owner' />
        </SectionShell>

        <SectionShell kicker='BLOOM' title='Bloom History'>
          <BloomHistoryCard versions={versions} mode='owner' />
        </SectionShell>

        <SectionShell kicker='BLOOM' title='AI Reflection'>
          <p className='mb-3 text-xs text-[#6b6b6b]'>現在のあなた</p>
          <BloomReflectionCard reflection={aiReflection} aiEnabled={aiEnabled} mode='owner' />
        </SectionShell>

        <form
          action={updatePhase4VisibilityAction}
          className='space-y-2 rounded-2xl border border-[#ebe9e4] bg-[#fafaf8] p-4'
        >
          <p className='text-xs font-semibold text-[#4a4a4a]'>Phase 4 公開設定</p>
          <label className='flex items-center gap-2 text-xs text-[#6b6b6b]'>
            <input type='checkbox' name='showTimeline' value='1' defaultChecked={settings.showTimeline} className='rounded' />
            Bloom Timelineを公開
          </label>
          <label className='flex items-center gap-2 text-xs text-[#6b6b6b]'>
            <input type='checkbox' name='showMemories' value='1' defaultChecked={settings.showMemories} className='rounded' />
            Bloom Memoriesを公開
          </label>
          <label className='flex items-center gap-2 text-xs text-[#6b6b6b]'>
            <input
              type='checkbox'
              name='showReflection'
              value='1'
              defaultChecked={settings.showReflection}
              className='rounded'
            />
            AI Reflectionを公開
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
          <h2 className='mb-3 text-sm font-semibold text-[#1a1a1a]'>Bloom Timeline</h2>
          <BloomTimelineCard entries={timeline!} mode='public' />
        </div>
      ) : null}
      {hasMemories ? (
        <div className='rounded-2xl border border-[#ebe9e4] bg-white p-5'>
          <h2 className='mb-3 text-sm font-semibold text-[#1a1a1a]'>Bloom Memories</h2>
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
