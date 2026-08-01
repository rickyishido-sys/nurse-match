import Link from 'next/link';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export default async function AdminParticipationPaymentsPage() {
  const admin = createAdminSupabaseClient();
  const payments = admin
    ? (
        await admin
          .from('hanakai_participation_payments')
          .select('id, event_id, member_id, amount, currency, status, square_payment_id, attempt_number, paid_at, failed_at, failure_code, refunded_at')
          .order('created_at', { ascending: false })
          .limit(100)
      ).data ?? []
    : [];

  return (
    <div className='space-y-6 p-6'>
      <div>
        <h1 className='text-xl font-semibold text-[#1a1a1a]'>HANAKAI参加費決済（管理者）</h1>
        <p className='mt-1 text-sm text-[#6b6b6b]'>Square Sandbox / Preview専用。Production決済は表示されません。</p>
      </div>

      <div className='overflow-x-auto rounded-2xl border border-[#ebe9e4] bg-white'>
        <table className='min-w-full text-left text-sm'>
          <thead className='border-b border-[#ebe9e4] bg-[#fafaf8] text-xs text-[#6b6b6b]'>
            <tr>
              <th className='px-4 py-3'>イベント</th>
              <th className='px-4 py-3'>参加者</th>
              <th className='px-4 py-3'>金額</th>
              <th className='px-4 py-3'>状態</th>
              <th className='px-4 py-3'>Square Payment ID</th>
              <th className='px-4 py-3'>試行</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className='px-4 py-8 text-center text-[#9a9a9a]'>
                  決済データがありません（Migration適用後、Sandbox選定で生成されます）
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className='border-b border-[#f0efec]'>
                  <td className='px-4 py-3 font-mono text-xs'>{String(p.event_id).slice(0, 8)}…</td>
                  <td className='px-4 py-3 font-mono text-xs'>{String(p.member_id).slice(0, 8)}…</td>
                  <td className='px-4 py-3'>{p.amount} {p.currency}</td>
                  <td className='px-4 py-3'>{p.status}</td>
                  <td className='px-4 py-3 font-mono text-xs'>{p.square_payment_id ?? '—'}</td>
                  <td className='px-4 py-3'>{p.attempt_number}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Link href='/admin/hanakai' className='text-sm font-semibold text-[#1f5d4f] underline-offset-2 hover:underline'>
        ← HANAKAI管理へ
      </Link>
    </div>
  );
}
