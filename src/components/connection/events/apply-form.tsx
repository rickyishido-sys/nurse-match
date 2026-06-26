'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { applyConnectionEventAction } from '@/lib/connection/actions';

const MIN = 100;
const MAX = 300;

export function ApplyForm({
  eventId,
  approvalMode,
}: {
  eventId: string;
  approvalMode: 'host_approval' | 'auto';
}) {
  const [reason, setReason] = useState('');
  const valid = reason.trim().length >= MIN && reason.trim().length <= MAX;
  const count = reason.length;

  return (
    <form action={applyConnectionEventAction} className='space-y-3'>
      <input type='hidden' name='eventId' value={eventId} />

      <div>
        <label htmlFor='reason' className='mb-2 block text-sm font-semibold text-[#1a1a1a]'>
          参加理由
        </label>
        <textarea
          id='reason'
          name='reason'
          rows={5}
          minLength={MIN}
          maxLength={MAX}
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder='「最近花に興味を持ちました。」&#10;「色々な方と話してみたいと思っています。」'
          className='w-full resize-none rounded-2xl border border-[#ddd9d1] bg-white px-4 py-3 text-sm leading-7 text-[#1a1a1a] outline-none transition focus:border-[#1f5d4f] focus:ring-2 focus:ring-[#1f5d4f]/15'
        />
        <div className='mt-1.5 flex items-center justify-between text-xs'>
          <span className='text-[#9a9a9a]'>
            {approvalMode === 'auto'
              ? 'この想いを添えて参加できます。'
              : '主催者がこの想いを読んで参加者を選びます。'}
          </span>
          <span className={count > MAX || (count > 0 && count < MIN) ? 'text-[#c0526b]' : 'text-[#9a9a9a]'}>
            {count} / {MIN}〜{MAX}
          </span>
        </div>
      </div>

      <motion.button
        type='submit'
        whileTap={{ scale: 0.98 }}
        disabled={!valid}
        className='w-full rounded-full bg-[#1f5d4f] py-4 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40'
      >
        {approvalMode === 'auto' ? '参加する' : '参加申請する'}
      </motion.button>
    </form>
  );
}
