'use client';

import Image from 'next/image';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { Chip } from '@/components/connection/ui';
import { INTEREST_TAG_LABEL } from '@/lib/connection/data';
import { finalizeEventParticipantsAction } from '@/lib/connection/actions';
import type { EventApplicationStatus } from '@/lib/connection/types';

export type HostApplicantCard = {
  applicationId: string;
  memberId: string;
  nickname: string;
  age: number;
  area: string;
  avatarUrl: string;
  bio: string;
  reason: string;
  interestTags: string[];
  identityVerified: boolean;
};

export type HostMemberRow = {
  applicationId: string;
  memberId: string;
  nickname: string;
  age: number;
  area: string;
  avatarUrl: string;
  status: EventApplicationStatus;
  statusLabel: string;
};

type HostParticipantSelectionProps = {
  eventId: string;
  eventTitle: string;
  capacity: number;
  participantsDecided: boolean;
  pendingApplicants: HostApplicantCard[];
  selectedMembers: HostMemberRow[];
  redirectPath: string;
  /** 運営 /manage から操作する場合 */
  asAdmin?: boolean;
};

function SelectionMark({ selected }: { selected: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
        selected
          ? 'border-[#1f5d4f] bg-[#e7f0ea] text-[#1f5d4f]'
          : 'border-[#d8d3cb] bg-white text-[#9a9a9a]'
      }`}
      aria-hidden
    >
      {selected ? '✓ 選択済み' : '□ 参加メンバーに追加'}
    </span>
  );
}

export function HostParticipantSelection({
  eventId,
  eventTitle,
  capacity,
  participantsDecided,
  pendingApplicants,
  selectedMembers,
  redirectPath,
  asAdmin = false,
}: HostParticipantSelectionProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCount = selectedIds.size;
  const atCapacity = selectedCount >= capacity;
  const canSubmit = selectedCount > 0 && !isPending;

  const toggle = useCallback(
    (applicationId: string) => {
      if (participantsDecided || isPending) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(applicationId)) {
          next.delete(applicationId);
          return next;
        }
        if (next.size >= capacity) return prev;
        next.add(applicationId);
        return next;
      });
    },
    [capacity, isPending, participantsDecided],
  );

  const selectedSummary = useMemo(
    () => pendingApplicants.filter((a) => selectedIds.has(a.applicationId)),
    [pendingApplicants, selectedIds],
  );

  const handleFinalize = () => {
    setError(null);
    startTransition(async () => {
      const result = await finalizeEventParticipantsAction({
        eventId,
        selectedApplicationIds: [...selectedIds],
        redirectPath,
        asAdmin,
      });
      if (!result.ok) {
        setError(result.error);
        setShowConfirm(false);
      }
    });
  };

  if (participantsDecided) {
    return (
      <div className='space-y-6 pb-4'>
        <section className='space-y-3'>
          <h2 className='text-sm font-semibold text-[#1a1a1a]'>
            今回の参加メンバー{' '}
            <span className='font-normal text-[#9a9a9a]'>{selectedMembers.length}名</span>
          </h2>
          {selectedMembers.length === 0 ? (
            <p className='text-sm text-[#9a9a9a]'>参加メンバーはまだ確定していません。</p>
          ) : (
            <ul className='space-y-2'>
              {selectedMembers.map((m) => (
                <li
                  key={m.applicationId}
                  className='flex items-center gap-3 rounded-2xl border border-[#ebe9e4] bg-white px-3 py-2.5'
                >
                  <Image
                    src={m.avatarUrl}
                    alt={m.nickname}
                    width={40}
                    height={40}
                    className='h-10 w-10 shrink-0 rounded-full object-cover object-[center_20%]'
                  />
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium text-[#1a1a1a]'>{m.nickname}</p>
                    <p className='text-[11px] text-[#6b6b6b]'>
                      {m.age}歳 · {m.area}
                    </p>
                  </div>
                  <span className='shrink-0 rounded-full bg-[#f3f7f5] px-2 py-0.5 text-[10px] font-medium text-[#1f5d4f]'>
                    {m.statusLabel}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <p className='rounded-2xl border border-[#ebe9e4] bg-[#faf9f6] px-4 py-3 text-xs leading-6 text-[#6b6b6b]'>
          参加メンバーへの通知を送信しました。選ばれた方は参加確認のご案内を、それ以外の方には丁寧なお知らせをお送りしています。
        </p>
      </div>
    );
  }

  return (
    <>
      <div className='space-y-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))]'>
        <p className='rounded-2xl border border-[#ebe9e4] bg-white px-4 py-3 text-xs leading-6 text-[#6b6b6b]'>
          プロフィールと参加理由を見ながら、この体験に合うメンバーを選んでください。決定後、申請者へ結果が通知されます。
        </p>

        {pendingApplicants.length === 0 ? (
          <p className='text-sm text-[#9a9a9a]'>現在、選定待ちの申請はありません。</p>
        ) : (
          <ul className='space-y-3'>
            {pendingApplicants.map((applicant) => {
              const selected = selectedIds.has(applicant.applicationId);
              const disabled = !selected && atCapacity;
              return (
                <li key={applicant.applicationId}>
                  <button
                    type='button'
                    onClick={() => toggle(applicant.applicationId)}
                    disabled={disabled || isPending}
                    aria-pressed={selected}
                    aria-label={`${applicant.nickname}を${selected ? '選択解除' : '参加メンバーに追加'}`}
                    className={`w-full rounded-2xl border p-3.5 text-left transition-colors ${
                      selected
                        ? 'border-[#1f5d4f] bg-[#f3f7f5] shadow-[0_0_0_1px_rgba(31,93,79,0.06)]'
                        : disabled
                          ? 'cursor-not-allowed border-[#ebe9e4] bg-[#faf9f7] opacity-60'
                          : 'border-[#ebe9e4] bg-white hover:border-[#cfe3da]'
                    }`}
                  >
                    <div className='flex items-start gap-3'>
                      <Image
                        src={applicant.avatarUrl}
                        alt=''
                        width={48}
                        height={48}
                        className='h-12 w-12 shrink-0 rounded-full object-cover object-[center_20%]'
                      />
                      <div className='min-w-0 flex-1 space-y-1'>
                        <div className='flex items-start justify-between gap-2'>
                          <div>
                            <div className='flex flex-wrap items-center gap-1.5'>
                              <p className='text-sm font-semibold text-[#1a1a1a]'>{applicant.nickname}</p>
                              {applicant.identityVerified ? (
                                <span className='inline-flex shrink-0 items-center gap-0.5 rounded-full border border-[#cfe3da] bg-[#eef4f0] px-1.5 py-0.5 text-[10px] font-semibold text-[#1f5d4f]'>
                                  ✓ 認証済み
                                </span>
                              ) : null}
                            </div>
                            <p className='text-xs text-[#9a9a9a]'>
                              {applicant.age}歳 · {applicant.area}
                            </p>
                          </div>
                          <SelectionMark selected={selected} />
                        </div>
                        {applicant.bio.trim() ? (
                          <p className='line-clamp-2 text-xs leading-relaxed text-[#5a5247]'>{applicant.bio}</p>
                        ) : null}
                        {applicant.interestTags.length > 0 ? (
                          <div className='flex flex-wrap gap-1 pt-0.5'>
                            {applicant.interestTags.slice(0, 4).map((t) => (
                              <Chip key={t} tone='neutral'>
                                {INTEREST_TAG_LABEL[t as keyof typeof INTEREST_TAG_LABEL] ?? t}
                              </Chip>
                            ))}
                          </div>
                        ) : null}
                        <p className='pt-1 text-[11px] leading-relaxed text-[#7a7268]'>
                          <span className='text-[#9a9a9a]'>参加理由：</span>
                          {applicant.reason || '（未入力）'}
                        </p>
                      </div>
                    </div>
                    {disabled ? (
                      <p className='mt-2 text-[10px] text-[#9a9a9a]'>定員に達したため、追加の選択はできません</p>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {error ? (
          <p className='rounded-2xl border border-[#f0dede] bg-[#fdf8f8] px-4 py-3 text-xs text-[#8b4545]' role='alert'>
            {error}
          </p>
        ) : null}
      </div>

      {!participantsDecided && pendingApplicants.length > 0 ? (
        <div
          className='fixed inset-x-0 bottom-0 z-40 border-t border-[#ebe9e4] bg-white/95 px-4 pt-3 backdrop-blur-sm'
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <p className='mb-2 text-center text-xs text-[#6b6b6b]'>
            選択中{' '}
            <span className='font-semibold text-[#1f5d4f]'>{selectedCount}</span>
            {' / '}
            <span className='font-semibold'>{capacity}</span>
            名<span className='text-[#9a9a9a]'>（定員）</span>
          </p>
          <button
            type='button'
            disabled={!canSubmit}
            onClick={() => setShowConfirm(true)}
            className='h-12 w-full rounded-full bg-[#1f5d4f] text-sm font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40'
          >
            このメンバーへ参加案内を送る
          </button>
        </div>
      ) : null}

      {showConfirm ? (
        <div
          className='fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center'
          role='dialog'
          aria-modal='true'
          aria-labelledby='finalize-dialog-title'
        >
          <div className='w-full max-w-md rounded-2xl bg-white p-5 shadow-xl'>
            <h3 id='finalize-dialog-title' className='text-base font-semibold text-[#1a1a1a]'>
              参加案内を送りますか？
            </h3>
            <p className='mt-3 text-sm leading-7 text-[#5a5247]'>
              選択した{selectedCount}名へ参加案内を送り、登録済みカードへHANAKAI参加費500円を自動請求します。
              決済に成功した方のみ、正式な参加メンバーとして確定します。
            </p>
            <ul className='mt-3 space-y-1 text-xs text-[#6b6b6b]'>
              {selectedSummary.map((a) => (
                <li key={a.applicationId}>· {a.nickname}</li>
              ))}
            </ul>
            <div className='mt-5 flex gap-3'>
              <button
                type='button'
                disabled={isPending}
                onClick={() => setShowConfirm(false)}
                className='h-11 flex-1 rounded-full border border-[#d8d3cb] text-sm font-semibold text-[#6b6b6b]'
              >
                戻る
              </button>
              <button
                type='button'
                disabled={isPending}
                onClick={handleFinalize}
                className='h-11 flex-1 rounded-full bg-[#1f5d4f] text-sm font-semibold text-white disabled:opacity-50'
              >
                {isPending ? '決定中…' : 'このメンバーで決定する'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
