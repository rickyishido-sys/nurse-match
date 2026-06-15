'use client';

import { useRef, useState } from 'react';
import { CHEER_TIERS, COIN_PACKAGES, formatCoin, type CheerEvent, type CheerTier } from '@/lib/hanakai/data';

// 画面いっぱいに花が舞い上がる演出。コイン額（tier.size）で規模が変わる。
function FlowerBurst({ burst }: { burst: { key: number; tier: CheerTier } | null }) {
  if (!burst) return null;
  const { tier, key } = burst;
  const count = tier.size === 'xl' ? 20 : tier.size === 'lg' ? 13 : tier.size === 'md' ? 8 : 5;
  const baseRem = tier.size === 'xl' ? 3.2 : tier.size === 'lg' ? 2.6 : tier.size === 'md' ? 2 : 1.6;

  const flowers = Array.from({ length: count }, (_, i) => {
    const emoji = tier.burst[i % tier.burst.length];
    const left = Math.min(94, Math.max(3, (i / count) * 92 + (Math.random() * 10 - 5)));
    const delay = (i % 6) * 0.1 + Math.random() * 0.15;
    const dur = 1.6 + (i % 4) * 0.25;
    const size = baseRem + (Math.random() * 0.8 - 0.3);
    return (
      <span
        key={`${key}-${i}`}
        className='hanakai-flower'
        style={{ left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${dur}s`, fontSize: `${size}rem` }}
      >
        {emoji}
      </span>
    );
  });

  return (
    <div className='pointer-events-none fixed inset-0 z-[60] mx-auto max-w-[420px] overflow-hidden' aria-hidden>
      {tier.size === 'xl' || tier.size === 'lg' ? (
        <span
          className='hanakai-flower-center absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2'
          style={{ fontSize: tier.size === 'xl' ? '7rem' : '4.5rem' }}
        >
          {tier.emoji}
        </span>
      ) : null}
      {flowers}
    </div>
  );
}

type CheerButtonProps = {
  initialBalance: number;
  targetTitle?: string;
  variant?: 'block' | 'inline';
  onCheer?: (tier: CheerTier) => void;
};

// 💛 応援する → コインを選ぶ → 花の演出。コインは応援の手段、花は演出。
export function CheerButton({ initialBalance, targetTitle, variant = 'block', onCheer }: CheerButtonProps) {
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState(initialBalance);
  const [burst, setBurst] = useState<{ key: number; tier: CheerTier } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  function schedule(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }

  function cheer(tier: CheerTier) {
    if (balance < tier.coins) {
      setToast('コインが不足しています。チャージしてください。');
      schedule(() => setToast(null), 2200);
      return;
    }
    setBalance((b) => b - tier.coins);
    setBurst({ key: Date.now(), tier });
    setOpen(false);
    setToast(`${formatCoin(tier.coins)} で応援しました ${tier.emoji}`);
    onCheer?.(tier);
    schedule(() => setBurst(null), 2300);
    schedule(() => setToast(null), 2800);
  }

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        className={
          variant === 'block'
            ? 'h-12 w-full rounded-2xl bg-gradient-to-r from-[#4f7a4a] to-[#caa66a] text-sm font-bold text-white shadow-[0_12px_24px_-14px_rgba(79,122,74,0.9)]'
            : 'rounded-full bg-[#4f7a4a] px-4 py-2 text-xs font-bold text-white'
        }
      >
        💛 応援する
      </button>

      {open ? (
        <div className='fixed inset-0 z-50 mx-auto flex max-w-[420px] items-end justify-center' role='dialog' aria-modal>
          <div className='absolute inset-0 bg-black/40' onClick={() => setOpen(false)} />
          <div className='relative w-full rounded-t-3xl border-t border-[#eaeee6] bg-white p-5 pb-8'>
            <div className='mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200' />
            <div className='mb-3 flex items-center justify-between'>
              <div>
                <p className='text-sm font-bold text-slate-800'>応援メニュー</p>
                {targetTitle ? <p className='text-[11px] text-slate-500'>{targetTitle}</p> : null}
              </div>
              <div className='rounded-full bg-[#f6efdf] px-3 py-1 text-right'>
                <p className='text-[10px] text-[#9b7d3f]'>保有コイン</p>
                <p className='text-sm font-bold text-[#9b7d3f]'>{balance.toLocaleString('ja-JP')} Coin</p>
              </div>
            </div>

            <div className='space-y-2'>
              {CHEER_TIERS.map((tier) => {
                const enough = balance >= tier.coins;
                return (
                  <button
                    key={tier.id}
                    type='button'
                    onClick={() => cheer(tier)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
                      enough ? 'border-[#e0d4b6] bg-white' : 'border-slate-100 bg-slate-50 opacity-60'
                    }`}
                  >
                    <span className='text-2xl'>{tier.emoji}</span>
                    <span className='min-w-0 flex-1'>
                      <span className='block text-sm font-bold text-slate-800'>{tier.label}</span>
                      <span className='block text-[11px] text-slate-500'>{tier.effect}</span>
                    </span>
                    <span className='shrink-0 text-sm font-bold text-[#9b7d3f]'>{tier.coins.toLocaleString('ja-JP')} Coin</span>
                  </button>
                );
              })}
            </div>

            <p className='mt-3 text-center text-[11px] leading-5 text-slate-500'>
              応援はコインで行い、画面に花として咲きます。見た目や人気ではなく、夢・挑戦への共感を贈る応援経済圏です。
            </p>
          </div>
        </div>
      ) : null}

      <FlowerBurst burst={burst} />

      {toast ? (
        <div className='pointer-events-none fixed inset-x-0 top-20 z-[70] mx-auto flex max-w-[420px] justify-center px-4'>
          <div className='rounded-full bg-slate-900/90 px-4 py-2 text-xs font-semibold text-white shadow-lg'>{toast}</div>
        </div>
      ) : null}
    </>
  );
}

// 保有コインの表示とチャージ（モック）。コインは決済手段、花は演出。
export function CoinWalletCard({ initialBalance }: { initialBalance: number }) {
  const [balance, setBalance] = useState(initialBalance);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  function buy(coins: number) {
    setBalance((b) => b + coins);
    setToast(`${coins.toLocaleString('ja-JP')} Coin をチャージしました（モック）`);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2200);
  }

  return (
    <div className='rounded-3xl bg-gradient-to-br from-[#f6efdf] to-[#fbeef0] p-5'>
      <div className='flex items-end justify-between'>
        <div>
          <p className='text-[11px] font-semibold tracking-wide text-[#9b7d3f]'>保有コイン</p>
          <p className='text-3xl font-bold tracking-tight text-[#9b7d3f]'>
            {balance.toLocaleString('ja-JP')} <span className='text-base'>Coin</span>
          </p>
        </div>
        <span className='text-3xl'>🪙</span>
      </div>
      <p className='mt-1 text-[11px] text-slate-500'>花会コインで夢や挑戦を応援できます（1 Coin = 1円・決済は準備中のモック）。</p>
      <div className='mt-3 grid grid-cols-5 gap-1.5'>
        {COIN_PACKAGES.map((pkg) => (
          <button
            key={pkg.coins}
            type='button'
            onClick={() => buy(pkg.coins)}
            className='rounded-xl border border-[#e0d4b6] bg-white py-2 text-[11px] font-bold text-[#9b7d3f] active:scale-95'
          >
            {pkg.coins.toLocaleString('ja-JP')}
          </button>
        ))}
      </div>
      {toast ? (
        <p className='mt-2 rounded-full bg-white/80 px-3 py-1 text-center text-[11px] font-semibold text-[#9b7d3f]'>{toast}</p>
      ) : null}
    </div>
  );
}

// ライブ用: 応援フィード（TikTokギフト風）＋応援ボタン。世界観は夢・挑戦への応援。
export function LiveCheerPanel({
  initialBalance,
  viewerName,
  seedFeed,
}: {
  initialBalance: number;
  viewerName: string;
  seedFeed: CheerEvent[];
}) {
  const [feed, setFeed] = useState<CheerEvent[]>(seedFeed);

  function onCheer(tier: CheerTier) {
    setFeed((prev) => [{ id: `me-${Date.now()}`, userName: viewerName, coins: tier.coins, emoji: tier.emoji }, ...prev].slice(0, 12));
  }

  return (
    <div className='space-y-3'>
      <div className='space-y-1.5'>
        {feed.map((ev) => (
          <div key={ev.id} className='flex items-center gap-2 rounded-2xl bg-[#f7faf5] px-3 py-2 text-xs'>
            <span className='font-semibold text-slate-700'>{ev.userName}</span>
            <span className='text-slate-500'>さんが {formatCoin(ev.coins)} 応援しました</span>
            <span className='ml-auto text-sm'>{ev.emoji.repeat(3)}</span>
          </div>
        ))}
      </div>
      <CheerButton initialBalance={initialBalance} onCheer={onCheer} />
    </div>
  );
}
