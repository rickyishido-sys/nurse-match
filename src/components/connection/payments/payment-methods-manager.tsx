'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SquareCardRegistration } from '@/components/connection/payments/square-card-registration';
import {
  formatCardBrand,
  formatCardMask,
  type PaymentMethodDisplay,
} from '@/lib/connection/payment-method-display';

type BoundApp = {
  applicationId: string;
  eventId: string;
  eventTitle: string;
  paymentMethodId: string;
};

type Props = {
  initialMethods: PaymentMethodDisplay[];
  boundApplications: BoundApp[];
};

export function PaymentMethodsManager({ initialMethods, boundApplications }: Props) {
  const router = useRouter();
  const [methods, setMethods] = useState(initialMethods);
  const [apps, setApps] = useState(boundApplications);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function setDefault(id: string) {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/hanakai/payments/card/set-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: id }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? '更新に失敗しました');
      setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));
      setMessage('デフォルトの支払い方法を更新しました');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新に失敗しました');
    } finally {
      setBusyId(null);
    }
  }

  async function disable(id: string) {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/hanakai/payments/card/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: id }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; code?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? '削除に失敗しました');
      }
      const remaining = methods.filter((m) => m.id !== id);
      if (remaining.length > 0 && !remaining.some((m) => m.isDefault)) {
        remaining[0] = { ...remaining[0], isDefault: true };
      }
      setMethods(remaining);
      setApps((prev) => prev.filter((a) => a.paymentMethodId !== id));
      setMessage('お支払い方法を削除しました');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除に失敗しました');
    } finally {
      setBusyId(null);
    }
  }

  async function reassignApp(applicationId: string, paymentMethodId: string) {
    setBusyId(applicationId);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/hanakai/payments/card/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, paymentMethodId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? '変更に失敗しました');
      setApps((prev) =>
        prev.map((a) => (a.applicationId === applicationId ? { ...a, paymentMethodId } : a)),
      );
      setMessage('参加申請の支払い方法を変更しました');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '変更に失敗しました');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className='space-y-5'>
      {error ? (
        <p className='rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
          {error}
        </p>
      ) : null}
      {message ? (
        <p className='rounded-2xl border border-[#dfe9e4] bg-[#f3f7f5] px-4 py-3 text-sm text-[#1f5d4f]'>
          {message}
        </p>
      ) : null}

      {methods.length === 0 ? (
        <p className='rounded-2xl border border-[#ebe9e4] bg-white px-4 py-5 text-sm leading-7 text-[#6b6b6b]'>
          登録済みのカードはありません。下のボタンから追加できます。イベント参加時にも登録できます。
        </p>
      ) : (
        <ul className='space-y-3'>
          {methods.map((m) => {
            const usedBy = apps.filter((a) => a.paymentMethodId === m.id);
            return (
              <li key={m.id} className='rounded-2xl border border-[#ebe9e4] bg-white px-4 py-4'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='text-sm font-semibold text-[#1a1a1a]'>
                      {formatCardBrand(m.brand)} {formatCardMask(m.last4)}
                    </p>
                    {m.expMonth && m.expYear ? (
                      <p className='mt-1 text-xs text-[#9a9a9a]'>
                        有効期限 {m.expMonth}/{m.expYear}
                      </p>
                    ) : null}
                    {m.isDefault ? (
                      <span className='mt-2 inline-flex rounded-full bg-[#eef4f0] px-2.5 py-0.5 text-[10px] font-semibold text-[#1f5d4f]'>
                        デフォルト
                      </span>
                    ) : null}
                  </div>
                </div>

                {usedBy.length > 0 ? (
                  <div className='mt-3 rounded-xl bg-[#fafaf8] px-3 py-2 text-xs leading-6 text-[#6b6b6b]'>
                    <p className='font-semibold text-[#4a4a4a]'>参加申請中のイベントで使用中</p>
                    <ul className='mt-1 space-y-1'>
                      {usedBy.map((a) => (
                        <li key={a.applicationId}>{a.eventTitle}</li>
                      ))}
                    </ul>
                    {methods.length > 1 ? (
                      <div className='mt-2 space-y-1'>
                        <p>削除前に別の支払い方法へ変更してください。</p>
                        {usedBy.map((a) => (
                          <label key={a.applicationId} className='block'>
                            <span className='text-[11px] text-[#8a8a8a]'>{a.eventTitle}</span>
                            <select
                              className='mt-1 w-full rounded-xl border border-[#ddd9d1] bg-white px-3 py-2 text-xs'
                              value={a.paymentMethodId}
                              disabled={busyId === a.applicationId}
                              onChange={(e) => reassignApp(a.applicationId, e.target.value)}
                            >
                              {methods.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {formatCardBrand(opt.brand)} {formatCardMask(opt.last4)}
                                </option>
                              ))}
                            </select>
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className='mt-3 flex flex-wrap gap-2'>
                  {!m.isDefault ? (
                    <button
                      type='button'
                      disabled={busyId === m.id}
                      onClick={() => setDefault(m.id)}
                      className='rounded-full border border-[#1f5d4f] px-3 py-1.5 text-xs font-semibold text-[#1f5d4f] disabled:opacity-40'
                    >
                      デフォルトにする
                    </button>
                  ) : null}
                  <button
                    type='button'
                    disabled={busyId === m.id || usedBy.length > 0}
                    onClick={() => disable(m.id)}
                    className='rounded-full border border-[#e8d5d5] px-3 py-1.5 text-xs font-semibold text-[#b42318] disabled:opacity-40'
                  >
                    削除
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!adding ? (
        <button
          type='button'
          onClick={() => setAdding(true)}
          className='flex h-12 w-full items-center justify-center rounded-full bg-[#1f5d4f] text-sm font-semibold text-white'
        >
          ＋ 新しいカードを追加
        </button>
      ) : (
        <div className='rounded-2xl border border-[#ebe9e4] bg-white px-4 py-4'>
          <SquareCardRegistration
            compact
            setAsDefault={methods.length === 0}
            title='新しいカードを追加'
            submitLabel='カードを追加'
            onCancel={() => setAdding(false)}
            onSaved={(pm) => {
              if (!pm) return;
              setMethods((prev) => [
                ...prev,
                {
                  id: pm.id,
                  brand: pm.brand,
                  last4: pm.last4,
                  isDefault: methods.length === 0,
                },
              ]);
              setAdding(false);
              setMessage('カードを追加しました');
              router.refresh();
            }}
          />
        </div>
      )}
    </div>
  );
}
