'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/connection/ui';
import { regenerateCheckinCodeForHost } from '@/lib/connection/event-operations/actions';

type Props = {
  eventId: string;
  hasCheckinCode: boolean;
  initialCode?: string | null;
};

export function HostCheckinCodeCard({ eventId, hasCheckinCode, initialCode = null }: Props) {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(
    initialCode && /^\d{4}$/.test(initialCode) ? initialCode : null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleRegenerate() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await regenerateCheckinCodeForHost(eventId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCode(result.code);
      setMessage('チェックインコードを再発行しました');
      router.refresh();
    });
  }

  return (
    <Card className='space-y-3'>
      <p className='text-sm font-semibold text-[#1a1a1a]'>現在のチェックインコード</p>
      <p className='text-xs leading-6 text-[#6b6b6b]'>
        イベント当日、参加者へ口頭で伝える4桁コードです。管理画面からいつでも確認・再発行できます。
      </p>

      {message ? (
        <p className='rounded-xl border border-[#cfe3da] bg-[#f3f7f5] px-3 py-2 text-xs font-medium text-[#1f5d4f]'>
          {message}
        </p>
      ) : null}
      {error ? (
        <p className='rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700' role='alert'>
          {error}
        </p>
      ) : null}

      {code ? (
        <p className='text-3xl font-bold tracking-[0.35em] text-[#1f5d4f]' aria-label={`チェックインコード ${code}`}>
          {code}
        </p>
      ) : hasCheckinCode ? (
        <p className='text-sm text-[#4a4a4a]'>
          以前のコードは表示できません。下のボタンから再発行すると、新しい4桁コードを確認できます。
        </p>
      ) : (
        <p className='text-sm text-[#4a4a4a]'>コード未設定です。再発行で新しいコードを作成できます。</p>
      )}

      <button
        type='button'
        disabled={pending}
        onClick={handleRegenerate}
        className='rounded-full border border-[#1f5d4f] px-4 py-2 text-xs font-semibold text-[#1f5d4f] disabled:opacity-50'
      >
        {pending ? '再発行中…' : 'チェックインコードを再発行'}
      </button>
      <p className='text-[11px] leading-5 text-[#9a9a9a]'>
        再発行すると以前のコードは無効になり、新しいコードのみが使えます。
      </p>
      <Link
        href={`/events/${eventId}/checkin`}
        className='text-xs font-medium text-[#1f5d4f] underline-offset-2 hover:underline'
      >
        参加者用チェックイン画面 →
      </Link>
    </Card>
  );
}
