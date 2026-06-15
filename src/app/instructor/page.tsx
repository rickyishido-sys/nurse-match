import Image from 'next/image';
import Link from 'next/link';
import { HanakaiShell } from '@/components/hanakai/shell';
import { Card, Chip } from '@/components/hanakai/ui';
import { getHanakaiViewer } from '@/lib/hanakai/session';
import {
  INSTRUCTOR_STAGE_LABEL,
  INSTRUCTOR_STAGE_ORDER,
  listCertifiedInstructors,
  listInstructorCandidates,
} from '@/lib/hanakai/data';
import type { InstructorStage } from '@/lib/hanakai/types';

const STAGE_DETAIL: Record<InstructorStage, string> = {
  participant: 'まずは花会に参加して、体験を楽しむところから。',
  regular: '何度も通い、場の雰囲気と仲間に馴染んでいく。',
  support: '受付や準備など、花会の運営を手伝いはじめる。',
  candidate: '講師を目指して、教える練習と試験準備に入る。',
  certified: '認定講師として、自分の花会を開けるようになる。',
  area_lead: 'エリアの花会を束ね、新しい拠点づくりを支える。',
};

const CRITERIA = [
  { label: '花会参加回数', icon: '🗓️', body: 'リアルの体験をどれだけ重ねたか' },
  { label: '投稿実績', icon: '🌸', body: '作品や想いをどれだけ共有したか' },
  { label: '参加者レビュー', icon: '⭐️', body: '一緒に過ごした人からの信頼' },
  { label: '応援ポイント', icon: '💛', body: '挑戦に集まった共感（投げ花）' },
  { label: '運営貢献', icon: '🤝', body: '場づくりへの関わり・サポート' },
  { label: '講師試験', icon: '📝', body: '教える技術と知識の確認' },
];

export default async function InstructorPage() {
  const viewer = await getHanakaiViewer();
  const candidates = listInstructorCandidates();
  const certified = listCertifiedInstructors();

  return (
    <HanakaiShell viewer={viewer}>
      <div className='space-y-6'>
        <section className='rounded-3xl bg-gradient-to-br from-[#eef4ea] to-[#f6efdf] p-5'>
          <p className='text-xs font-semibold tracking-[0.2em] text-[#4f7a4a]'>講師育成</p>
          <h1 className='mt-1 text-lg font-bold text-slate-800'>参加者から、講師へ。</h1>
          <p className='mt-2 text-xs leading-6 text-slate-600'>
            お金で買う資格ではありません。<strong className='text-[#4f7a4a]'>参加・投稿・レビュー・応援・貢献・試験</strong>という、
            体験と信頼の積み重ねで認定される設計です。
          </p>
        </section>

        {/* 育成ステップ */}
        <section>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>講師になるまでのステップ</h2>
          <div className='space-y-0'>
            {INSTRUCTOR_STAGE_ORDER.map((stage, idx) => (
              <div key={stage}>
                <div className='flex items-start gap-3 rounded-2xl border border-[#eaeee6] bg-white p-3'>
                  <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef4ea] text-xs font-bold text-[#4f7a4a]'>
                    {idx + 1}
                  </span>
                  <div className='min-w-0'>
                    <p className='text-sm font-bold text-slate-800'>
                      {INSTRUCTOR_STAGE_LABEL[stage]}
                      {stage === 'certified' ? <span className='ml-1'>🌸</span> : null}
                      {stage === 'area_lead' ? <span className='ml-1'>👑</span> : null}
                    </p>
                    <p className='mt-0.5 text-xs leading-5 text-slate-500'>{STAGE_DETAIL[stage]}</p>
                  </div>
                </div>
                {idx < INSTRUCTOR_STAGE_ORDER.length - 1 ? (
                  <div className='py-1 text-center text-[#caa66a]'>↓</div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {/* 認定の判定軸 */}
        <section>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>認定の判定軸</h2>
          <div className='grid grid-cols-1 gap-2'>
            {CRITERIA.map((c) => (
              <div key={c.label} className='flex items-center gap-3 rounded-2xl bg-[#f5f8f3] px-3 py-2.5'>
                <span className='text-lg'>{c.icon}</span>
                <div>
                  <p className='text-xs font-bold text-slate-700'>{c.label}</p>
                  <p className='text-[11px] text-slate-500'>{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>いま挑戦中の講師候補</h2>
          <div className='space-y-2'>
            {candidates.map((user) => (
              <Link key={user.id} href={`/members/${user.id}`} className='flex items-center gap-3 rounded-2xl border border-[#eaeee6] bg-white p-2.5'>
                <div className='relative h-10 w-10 overflow-hidden rounded-full'>
                  <Image src={user.avatarUrl} alt={user.nickname} fill className='object-cover' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold text-slate-800'>{user.nickname}</p>
                  <p className='truncate text-xs text-slate-500'>花会{user.joinedEventCount}回・投稿{user.postCount}・応援{user.cheerPoints}pt</p>
                </div>
                <Chip tone='green'>{INSTRUCTOR_STAGE_LABEL[user.instructorStage]}</Chip>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className='mb-2 text-sm font-bold text-slate-800'>認定講師・エリア責任者</h2>
          <div className='space-y-2'>
            {certified.map((user) => (
              <Link key={user.id} href={`/members/${user.id}`} className='flex items-center gap-3 rounded-2xl border border-[#f0e6cf] bg-[#fbf7ee] p-2.5'>
                <div className='relative h-10 w-10 overflow-hidden rounded-full'>
                  <Image src={user.avatarUrl} alt={user.nickname} fill className='object-cover' />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold text-slate-800'>{user.nickname}</p>
                  <p className='truncate text-xs text-slate-500'>{user.area}</p>
                </div>
                <Chip tone='gold'>{INSTRUCTOR_STAGE_LABEL[user.instructorStage]}</Chip>
              </Link>
            ))}
          </div>
        </section>

        <Card className='bg-[#f7faf5]'>
          <p className='text-xs leading-6 text-slate-600'>
            講師は教える人であると同時に、地域に花会という<strong className='text-[#4f7a4a]'>居場所</strong>をつくる人。
            あなたの挑戦も、仲間の投げ花で応援されます。
          </p>
          <Link href='/support' className='mt-2 inline-block text-xs font-semibold text-[#9b7d3f]'>挑戦を応援する ›</Link>
        </Card>
      </div>
    </HanakaiShell>
  );
}
