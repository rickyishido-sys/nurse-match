'use client';

import type { FormEvent } from 'react';
import { markRelationshipModeAction } from '@/lib/actions';

type Props = {
  matchId: string;
  actorUserId: string;
  disabled?: boolean;
};

export function MatchRelationshipActions({ matchId, actorUserId, disabled = false }: Props) {
  const confirmMessage =
    'この相手とのマッチングを成立済みにします。プライバシー保護のため、プロフィール・チャットは非公開化され、一定期間後に削除対象になります。';

  function confirmSubmit(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
    }
  }

  return (
    <div className='grid grid-cols-2 gap-2 text-[11px]'>
      <form action={markRelationshipModeAction} onSubmit={confirmSubmit}>
        <input type='hidden' name='matchId' value={matchId} />
        <input type='hidden' name='actorUserId' value={actorUserId} />
        <button disabled={disabled} className='w-full rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-2 text-indigo-700 disabled:opacity-40'>
          マッチング成立
        </button>
      </form>
      <form action={markRelationshipModeAction} onSubmit={confirmSubmit}>
        <input type='hidden' name='matchId' value={matchId} />
        <input type='hidden' name='actorUserId' value={actorUserId} />
        <button disabled={disabled} className='w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-700 disabled:opacity-40'>
          外部連絡へ移行した
        </button>
      </form>
    </div>
  );
}
