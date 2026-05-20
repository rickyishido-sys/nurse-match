import { Badge } from '@/components/badges';
import { sendMessageAction } from '@/lib/actions';
import type { AppUser, MessageRecord } from '@/lib/types/domain';

type ChatBoxProps = {
  matchId: string;
  user: AppUser;
  messages: MessageRecord[];
  frozen?: boolean;
};

export function ChatBox({ matchId, user, messages, frozen = false }: ChatBoxProps) {
  return (
    <div className='flex h-[74vh] flex-col overflow-hidden rounded-[26px] border border-slate-100 bg-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.45)]'>
      <div className='flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3'>
        <p className='text-sm font-semibold text-slate-800'>メッセージ</p>
        <Badge tone='green'>相手: 本人確認済み</Badge>
      </div>

      <div className='flex-1 space-y-2 overflow-y-auto px-3 py-3'>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-6 ${
              message.senderId === user.id
                ? 'ml-auto rounded-br-md bg-slate-900 text-white'
                : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'
            }`}
          >
            {message.body}
          </div>
        ))}
      </div>

      <form action={sendMessageAction} className='sticky bottom-0 border-t border-slate-100 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]'>
        <input type='hidden' name='matchId' value={matchId} />
        <input type='hidden' name='senderId' value={user.id} />
        <div className='flex gap-2'>
          <input
            name='body'
            placeholder={frozen ? '成立済みのため送信できません' : 'メッセージを入力'}
            className='h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm'
            disabled={frozen}
          />
          <button disabled={frozen} className='h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white disabled:opacity-40'>
            送信
          </button>
        </div>
      </form>
    </div>
  );
}
