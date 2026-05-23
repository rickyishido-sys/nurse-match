'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { sendMessageAction } from '@/lib/actions';
import type { AppUser, MessageRecord } from '@/lib/types/domain';

const FIRST_MESSAGE_TEMPLATES = [
  'はじめまして。よろしくお願いします。',
  '勤務形態が近くて気になりました。',
  'お仕事お疲れさまです。',
  '夜勤あるある話してみたいです。',
] as const;

type ChatThreadViewProps = {
  matchId: string;
  user: AppUser;
  messages: MessageRecord[];
  frozen?: boolean;
  partnerLastReadAt?: string | null;
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function toTime(value: string | null | undefined) {
  if (!value) return 0;
  const n = new Date(value).getTime();
  return Number.isNaN(n) ? 0 : n;
}

export function ChatThreadView({ matchId, user, messages, frozen = false, partnerLastReadAt = null }: ChatThreadViewProps) {
  const [draft, setDraft] = useState('');
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const lastMyMessageId = useMemo(() => {
    const mine = [...messages].reverse().find((m) => m.senderId === user.id);
    return mine?.id ?? null;
  }, [messages, user.id]);

  const showTemplates = messages.length === 0 && !frozen;

  function submitMessage(nextBody?: string) {
    const body = (nextBody ?? draft).trim();
    if (!body || frozen || isPending) return;
    startTransition(async () => {
      const form = new FormData();
      form.set('matchId', matchId);
      form.set('senderId', user.id);
      form.set('body', body);
      await sendMessageAction(form);
      setDraft('');
      router.refresh();
    });
  }

  return (
    <div className='relative flex h-[76vh] flex-col overflow-hidden rounded-[26px] border border-slate-100 bg-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)]'>
      <div ref={containerRef} className='flex-1 space-y-2 overflow-y-auto bg-slate-50/70 px-3 py-4'>
        {messages.length === 0 ? (
          <div className='rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm text-slate-500'>
            まずは丁寧な挨拶から始めましょう。
          </div>
        ) : null}
        {messages.map((message) => {
          const mine = message.senderId === user.id;
          const isRead = mine && toTime(partnerLastReadAt) >= toTime(message.createdAt);
          const isLastMine = mine && message.id === lastMyMessageId;
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-6 ${mine ? 'rounded-br-md bg-slate-900 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'}`}>
                <p>{message.body}</p>
                <div className={`mt-1 flex items-center gap-2 text-[10px] ${mine ? 'justify-end text-slate-300' : 'text-slate-400'}`}>
                  <span>{formatTime(message.createdAt)}</span>
                  {isLastMine ? <span>{isRead ? '既読' : '未読'}</span> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showTemplates ? (
        <div className='border-t border-slate-100 bg-white px-3 py-2'>
          <p className='mb-2 text-[11px] text-slate-500'>初回メッセージテンプレート</p>
          <div className='flex gap-2 overflow-x-auto pb-1'>
            {FIRST_MESSAGE_TEMPLATES.map((template) => (
              <button
                key={template}
                type='button'
                onClick={() => {
                  setDraft(template);
                  inputRef.current?.focus();
                }}
                className='shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700'
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className='border-t border-slate-100 bg-white px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2'>
        <div className='flex gap-2'>
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submitMessage();
              }
            }}
            disabled={frozen || isPending}
            placeholder={frozen ? 'このチャットは送信できません' : 'メッセージを入力'}
            className='h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm'
          />
          <button
            type='button'
            disabled={frozen || isPending || !draft.trim()}
            onClick={() => submitMessage()}
            className='h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white disabled:opacity-40'
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
