import { Card } from '@/components/connection/ui';
import { updateTrustVerificationAction } from '@/lib/connection/actions';
import {
  SAFETY_FLAG_PRESETS,
  TRUST_OPERATION_GUIDELINES,
  TRUST_OPERATION_NOTES,
  TRUST_STATUS_LABEL,
  VERIFICATION_SOURCE_LABEL,
} from '@/lib/connection/trust';
import type { ConnectionMember, TrustVerificationStatus, VerificationSource } from '@/lib/connection/types';

type TrustAdminPanelProps = {
  member: ConnectionMember;
  eventId: string;
};

const STATUS_OPTIONS: TrustVerificationStatus[] = ['pending', 'reviewing', 'verified', 'rejected'];
const SOURCE_OPTIONS: VerificationSource[] = ['none', 'id_only', 'id_plus_public_info'];

/** 管理画面専用 — 運営確認 運用パネル（非公開） */
export function TrustAdminPanel({ member, eventId }: TrustAdminPanelProps) {
  return (
    <div className='mt-4 space-y-3 rounded-2xl border border-dashed border-[#d8d6d1] bg-[#fafaf8] p-4'>
      <div>
        <p className='text-[11px] font-semibold tracking-wide text-[#6b6b6b]'>運営確認・安全確認（管理者のみ）</p>
        <p className='mt-0.5 text-[10px] text-[#9a9a9a]'>運営確認ステータス · 公開情報確認メモ・安全確認フラグは参加者には表示されません。</p>
      </div>

      <form action={updateTrustVerificationAction} className='space-y-3'>
        <input type='hidden' name='memberId' value={member.id} />
        <input type='hidden' name='eventId' value={eventId} />

        <label className='grid gap-1 text-xs'>
          <span className='font-medium text-[#4a4a4a]'>運営確認ステータス</span>
          <select
            name='trustVerificationStatus'
            defaultValue={member.trustVerificationStatus}
            className='rounded-xl border border-[#d8d6d1] bg-white px-3 py-2 text-xs'
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {TRUST_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>

        <label className='grid gap-1 text-xs'>
          <span className='font-medium text-[#4a4a4a]'>確認ソース</span>
          <select
            name='verificationSource'
            defaultValue={member.verificationSource}
            className='rounded-xl border border-[#d8d6d1] bg-white px-3 py-2 text-xs'
          >
            {SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {VERIFICATION_SOURCE_LABEL[s]}
              </option>
            ))}
          </select>
        </label>

        <label className='flex items-center gap-2 text-xs'>
          <input
            type='checkbox'
            name='identityVerified'
            value='1'
            defaultChecked={member.identityVerified}
            className='rounded'
          />
          <span className='text-[#4a4a4a]'>本人確認済み</span>
        </label>

        <label className='grid gap-1 text-xs'>
          <span className='font-medium text-[#4a4a4a]'>公開情報確認メモ（非公開）</span>
          <textarea
            name='trustNotes'
            rows={3}
            defaultValue={member.trustNotes ?? ''}
            placeholder='本人確認書類・SNS・メディア掲載等の確認内容'
            className='rounded-xl border border-[#d8d6d1] bg-white px-3 py-2 text-xs'
          />
        </label>

        <fieldset className='space-y-2'>
          <legend className='text-xs font-medium text-[#4a4a4a]'>安全確認フラグ</legend>
          <div className='flex flex-wrap gap-2'>
            {SAFETY_FLAG_PRESETS.map((flag) => (
              <label key={flag} className='flex items-center gap-1.5 rounded-full border border-[#ebe9e4] bg-white px-2.5 py-1 text-[10px]'>
                <input
                  type='checkbox'
                  name='safetyFlags'
                  value={flag}
                  defaultChecked={member.safetyFlags.includes(flag)}
                  className='rounded'
                />
                <span>{flag}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button type='submit' className='h-9 w-full rounded-full border border-[#1a1a1a] text-[11px] font-semibold text-[#1a1a1a]'>
          運営確認ステータスを更新
        </button>
      </form>
    </div>
  );
}

/** 管理画面ヘッダー — 運用ガイドライン */
export function TrustOperationGuide() {
  return (
    <div className='space-y-2 rounded-2xl border border-[#ebe9e4] bg-[#fafaf8] p-4'>
      <p className='text-xs font-semibold text-[#1a1a1a]'>運営確認・安全確認 運用メモ</p>
      <p className='text-[11px] leading-5 text-[#6b6b6b]'>運営確認ステータスの判断基準。以下を参考に、運営者が最終判断を行います。</p>
      <ul className='list-inside list-disc space-y-1 text-[11px] text-[#4a4a4a]'>
        {TRUST_OPERATION_GUIDELINES.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <ul className='mt-2 space-y-1 text-[10px] text-[#9a9a9a]'>
        {TRUST_OPERATION_NOTES.map((note) => (
          <li key={note}>※ {note}</li>
        ))}
      </ul>
    </div>
  );
}
