'use client';

import Image from 'next/image';
import { useMemo, useState, type ReactNode } from 'react';
import { Heading, HK, Kicker, Lead, Reveal, Section } from '@/components/connection/landing/v2/ui';
import { MOCK_PROFILES } from '@/lib/connection/mock-profile-assets';

const EVENT_IMAGES = [
  { src: '/hero/mobile/cafe.png', alt: 'カフェイベント' },
  { src: '/hero/mobile/flower.png', alt: '花と散歩イベント' },
  { src: '/hero/mobile/bar.png', alt: 'バー交流イベント' },
] as const;

const HOST_CAPACITY = 3;

const HOST_APPLICANTS = [
  {
    id: 'ken',
    name: 'Ken',
    meta: '32歳 · 渋谷',
    avatarSrc: MOCK_PROFILES.maleKen,
    reason: 'はじめての体験です。よろしくお願いします。',
    tags: 'カフェ · 散歩 · 映画',
  },
  {
    id: 'mio',
    name: 'Mio',
    meta: '29歳 · 横浜',
    avatarSrc: MOCK_PROFILES.femaleMio,
    reason: '花が好きで、同じ体験を楽しみたいです。',
    tags: '花 · カフェ · 読書',
  },
  {
    id: 'yui',
    name: 'Yui',
    meta: '34歳 · 表参道',
    avatarSrc: MOCK_PROFILES.femaleYui,
    reason: 'リアルな対話を大切にしたいと思い、参加しました。',
    tags: '読書 · 映画 · 音楽',
  },
  {
    id: 'sho',
    name: 'Sho',
    meta: '29歳 · 中目黒',
    avatarSrc: MOCK_PROFILES.maleSho,
    reason: '新しい体験から始まるつながりに興味があります。',
    tags: 'AI · カフェ · フィットネス',
  },
] as const;

function VerifiedBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border border-[#cfe3da] bg-[#eef4f0] px-1.5 py-0.5 text-[8px] font-semibold text-[#1f5d4f] ${className}`}
    >
      ✓ 認証済み
    </span>
  );
}

function Phone({ label, children, footer }: { label: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className='mx-auto w-full max-w-[220px] shrink-0 snap-center'>
      <div className='relative mx-auto flex h-[440px] w-full flex-col overflow-hidden rounded-[2rem] border-[6px] border-[#1a1a1a] bg-[#faf7f2] shadow-[0_14px_40px_rgba(26,26,26,0.14)] sm:h-[460px]'>
        <div className='absolute left-1/2 top-0 z-10 h-4 w-20 -translate-x-1/2 rounded-b-xl bg-[#1a1a1a]' />
        <div className='flex min-h-0 flex-1 flex-col'>
          <div className='flex shrink-0 items-center justify-between px-3 pb-1.5 pt-6'>
            <span className='text-[10px] font-semibold tracking-[0.14em] text-[#1f5d4f]'>HANAKAI</span>
            <span className='text-[9px] text-[#9a9a9a]'>{label}</span>
          </div>
          <div className='min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
            {children}
          </div>
          {footer ? <div className='shrink-0 border-t border-[#ebe9e4] bg-white/95 px-2.5 py-2 backdrop-blur-sm'>{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

function Avatar({ src, size = 32 }: { src: string; size?: number }) {
  return (
    <div
      className='relative shrink-0 overflow-hidden rounded-full bg-[#e7ddcf] ring-1 ring-[#ebe9e4]'
      style={{ width: size, height: size }}
    >
      <Image src={src} alt='' fill sizes={`${size}px`} className='object-cover object-[center_20%]' loading='lazy' />
    </div>
  );
}

function EventCard({
  title,
  meta,
  badge,
  imageSrc,
  imageAlt,
}: {
  title: string;
  meta: string;
  badge?: string;
  imageSrc: string;
  imageAlt: string;
}) {
  return (
    <div className='overflow-hidden rounded-xl border border-[#ebe9e4] bg-white'>
      <div className='relative h-14 w-full'>
        <Image src={imageSrc} alt={imageAlt} fill sizes='220px' className='object-cover' loading='lazy' />
      </div>
      <div className='p-2.5'>
        <div className='flex items-start justify-between gap-2'>
          <p className='text-[10px] font-semibold leading-snug text-[#1a1a1a]'>{title}</p>
          {badge ? (
            <span className='shrink-0 rounded-full bg-[#e7f0ea] px-1.5 py-0.5 text-[8px] font-semibold text-[#1f5d4f]'>
              {badge}
            </span>
          ) : null}
        </div>
        <p className='mt-0.5 text-[9px] text-[#6b6b6b]'>{meta}</p>
      </div>
    </div>
  );
}

function SelectionBadge({ selected }: { selected: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[8px] font-semibold ${
        selected
          ? 'border-[#1f5d4f] bg-[#e7f0ea] text-[#1f5d4f]'
          : 'border-[#d8d3cb] bg-white text-[#9a9a9a]'
      }`}
    >
      {selected ? '✓ 選択済み' : '□ 選択'}
    </span>
  );
}

function SelectableParticipantCard({
  name,
  meta,
  avatarSrc,
  tags,
  reason,
  selected,
  onToggle,
  disabled,
}: {
  name: string;
  meta: string;
  avatarSrc: string;
  tags: string;
  reason: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type='button'
      onClick={onToggle}
      disabled={disabled}
      className={`w-full rounded-xl border p-2 text-left transition-colors ${
        selected
          ? 'border-[#1f5d4f] bg-[#f3f7f5] shadow-[0_0_0_1px_rgba(31,93,79,0.08)]'
          : 'border-[#ebe9e4] bg-white hover:border-[#cfe3da] hover:bg-[#faf9f7]'
      } ${disabled ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
    >
      <div className='flex items-start gap-2'>
        <Avatar src={avatarSrc} size={36} />
        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-1'>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-1'>
                <p className='text-[10px] font-semibold text-[#1a1a1a]'>{name}</p>
                <VerifiedBadge />
              </div>
              <p className='mt-0.5 text-[9px] text-[#6b6b6b]'>{meta}</p>
            </div>
            <SelectionBadge selected={selected} />
          </div>
          <p className='mt-1.5 text-[8px] leading-relaxed text-[#7a7268]'>
            趣味：{tags}
          </p>
          <p className='mt-0.5 line-clamp-2 text-[8px] leading-relaxed text-[#7a7268]'>
            参加理由：{reason}
          </p>
        </div>
      </div>
    </button>
  );
}

function NotificationCard({
  name,
  avatarSrc,
  type,
}: {
  name: string;
  avatarSrc: string;
  type: 'accepted' | 'waitlist';
}) {
  const accepted = type === 'accepted';
  return (
    <div
      className={`rounded-xl border p-2 ${
        accepted ? 'border-[#cfe3da] bg-[#f3f7f5]' : 'border-[#ebe9e4] bg-white'
      }`}
    >
      <div className='flex items-center gap-2'>
        <Avatar src={avatarSrc} size={28} />
        <div className='min-w-0 flex-1'>
          <p className='text-[9px] font-semibold text-[#1a1a1a]'>{name}</p>
          <p className={`mt-0.5 text-[8px] leading-relaxed ${accepted ? 'text-[#1f5d4f]' : 'text-[#6b6b6b]'}`}>
            {accepted ? (
              <>参加決定通知</>
            ) : (
              <>
                今回は定員を超えるお申し込みがあったため、ご参加いただけませんでした。また次回お会いできることを楽しみにしております。
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function HostSelectionMock() {
  const [phase, setPhase] = useState<'selecting' | 'confirmed'>('selecting');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const selectedCount = selectedIds.size;
  const canConfirm = selectedCount === HOST_CAPACITY;

  const selectedApplicants = useMemo(
    () => HOST_APPLICANTS.filter((a) => selectedIds.has(a.id)),
    [selectedIds],
  );
  const unselectedApplicants = useMemo(
    () => HOST_APPLICANTS.filter((a) => !selectedIds.has(a.id)),
    [selectedIds],
  );

  const toggle = (id: string) => {
    if (phase === 'confirmed') return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (next.size >= HOST_CAPACITY) return prev;
      next.add(id);
      return next;
    });
  };

  const footer =
    phase === 'selecting' ? (
      <div className='space-y-1.5'>
        <p className='text-center text-[9px] text-[#6b6b6b]'>
            選択中{' '}
            <span className='font-semibold text-[#1f5d4f]'>{selectedCount}</span>
            {' / '}
            <span className='font-semibold'>{HOST_CAPACITY}</span>
            名<span className='text-[#9a9a9a]'>（定員）</span>
        </p>
        <button
          type='button'
          disabled={!canConfirm}
          onClick={() => setPhase('confirmed')}
          className='w-full rounded-full py-2 text-[9px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40'
          style={{ backgroundColor: HK.green }}
        >
          このメンバーで開催する
        </button>
      </div>
    ) : (
      <p className='text-center text-[8px] leading-relaxed text-[#6b6b6b]'>
        参加者への通知を送信しました
      </p>
    );

  return (
    <Phone label='主催者' footer={footer}>
      <div className='space-y-2 pb-1'>
        <div>
          <p className='text-[10px] font-semibold text-[#1f5d4f]'>
            {phase === 'selecting' ? '体験に合うメンバーを選ぶ' : '参加者への通知'}
          </p>
          <p className='mt-0.5 text-[8px] leading-relaxed text-[#9a9a9a]'>
            {phase === 'selecting'
              ? 'プロフィールと参加理由を見ながら、この体験に合う方を選んでください。'
              : '選ばれた方には参加決定通知、定員外の方には丁寧なお知らせを送ります。'}
          </p>
        </div>

        {phase === 'selecting' ? (
          HOST_APPLICANTS.map((applicant) => {
            const selected = selectedIds.has(applicant.id);
            const atCapacity = selectedCount >= HOST_CAPACITY;
            return (
              <SelectableParticipantCard
                key={applicant.id}
                name={applicant.name}
                meta={applicant.meta}
                avatarSrc={applicant.avatarSrc}
                tags={applicant.tags}
                reason={applicant.reason}
                selected={selected}
                onToggle={() => toggle(applicant.id)}
                disabled={!selected && atCapacity}
              />
            );
          })
        ) : (
          <div className='space-y-1.5'>
            {selectedApplicants.map((a) => (
              <NotificationCard key={a.id} name={a.name} avatarSrc={a.avatarSrc} type='accepted' />
            ))}
            {unselectedApplicants.map((a) => (
              <NotificationCard key={a.id} name={a.name} avatarSrc={a.avatarSrc} type='waitlist' />
            ))}
          </div>
        )}
      </div>
    </Phone>
  );
}

export function LandingAppMock() {
  return (
    <Section tone='cream' className='overflow-x-hidden'>
      <div className='flex flex-col items-center text-center'>
        <Reveal>
          <Kicker>Point 06</Kicker>
        </Reveal>
        <Reveal delay={0.05}>
          <Heading className='mt-5'>華会でできること</Heading>
        </Reveal>
        <Reveal delay={0.1}>
          <Lead className='hk-copy-ja mt-6 max-w-[48ch]'>
            <span className='block'>プロフィール作成 → 本人確認（必須） → HANAKAI運営が確認 → 認証済み。</span>
            <span className='block'>
              その後、体験へ申し込み。主催者がプロフィール・参加理由を見ながら、この体験に合うメンバーを選びます。
            </span>
          </Lead>
        </Reveal>
      </div>

      <Reveal delay={0.15} className='mx-auto mt-12 w-full max-w-full'>
        <div className='mx-auto flex w-full max-w-[980px] flex-col items-center gap-5 px-0 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-5 md:px-0'>
          <Phone label='イベント'>
            <div className='space-y-2'>
              <p className='text-[10px] font-semibold text-[#1f5d4f]'>今週の体験</p>
              <EventCard
                title='カフェで語らう会'
                meta='土曜 · 渋谷 · 定員8名'
                badge='募集中'
                imageSrc={EVENT_IMAGES[0].src}
                imageAlt={EVENT_IMAGES[0].alt}
              />
              <EventCard
                title='花と散歩クラブ'
                meta='日曜 · 代々木 · 定員10名'
                imageSrc={EVENT_IMAGES[1].src}
                imageAlt={EVENT_IMAGES[1].alt}
              />
            </div>
          </Phone>

          <Phone label='参加申請'>
            <div className='space-y-2.5'>
              <div className='overflow-hidden rounded-xl bg-gradient-to-br from-[#e7f0ea] to-white'>
                <div className='relative h-12 w-full'>
                  <Image src={EVENT_IMAGES[0].src} alt='' fill sizes='220px' className='object-cover' loading='lazy' />
                </div>
                <div className='p-2.5'>
                  <p className='text-[10px] font-semibold text-[#1a1a1a]'>カフェで語らう会</p>
                  <p className='mt-0.5 text-[9px] text-[#6b6b6b]'>参加申請を送信しました</p>
                </div>
              </div>
              <div className='rounded-xl border border-[#ebe9e4] bg-white p-2.5 text-[9px] leading-relaxed text-[#5a5247]'>
                認証済みのうえで参加申請を送信しました。主催者がプロフィール・参加理由・趣味・価値観を確認し、この体験に合うメンバーを選びます。
              </div>
            </div>
          </Phone>

          <Phone label='プロフィール'>
            <div className='space-y-2.5'>
              <div className='flex items-center gap-2.5'>
                <Avatar src={MOCK_PROFILES.femaleAoi} size={44} />
                <div>
                  <div className='flex flex-wrap items-center gap-1'>
                    <p className='text-[10px] font-semibold text-[#1a1a1a]'>Aoi</p>
                    <VerifiedBadge />
                  </div>
                  <p className='text-[9px] text-[#6b6b6b]'>28歳 · 横浜</p>
                </div>
              </div>
              <div className='rounded-xl bg-white p-2.5'>
                <p className='text-[9px] font-medium text-[#9a9a9a]'>自己紹介</p>
                <p className='mt-1 text-[9px] leading-relaxed text-[#4a4a4a]'>
                  カフェ巡りが好きで、花が好き。休日は散歩しています。
                </p>
              </div>
              <div className='flex flex-wrap gap-1'>
                {['カフェ', '花', '散歩'].map((tag) => (
                  <span key={tag} className='rounded-full bg-[#f3f7f5] px-1.5 py-0.5 text-[8px] text-[#1f5d4f]'>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Phone>

          <HostSelectionMock />
        </div>
      </Reveal>
    </Section>
  );
}
