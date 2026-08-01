import {
  formatEventParticipationFee,
  formatHanakaiParticipationFee,
  HANAKAI_PARTICIPATION_FEE_LABEL,
} from '@/lib/connection/participation-fee';
import { formatEventFeeDisplay, eventFeeFormFromEvent } from '@/lib/connection/event-fee-meta';
import type { EventFeeType } from '@/lib/connection/types';
import { HK } from '@/lib/connection/brand/tokens';

type EventFeeCardsProps = {
  eventFee?: number;
  eventFeeType?: EventFeeType | null;
  eventFeeAmount?: number | null;
  eventFeeMin?: number | null;
  eventFeeMax?: number | null;
  eventFeeIncludes?: string | null;
  eventFeeExcludes?: string | null;
  eventFeeNotes?: string | null;
  /** Precomputed display label (create preview) */
  eventFeeLabel?: string;
};

export function EventFeeCards(props: EventFeeCardsProps) {
  const form = eventFeeFormFromEvent({
    fee: props.eventFee,
    eventFeeType: props.eventFeeType,
    eventFeeAmount: props.eventFeeAmount,
    eventFeeMin: props.eventFeeMin,
    eventFeeMax: props.eventFeeMax,
    eventFeeNotes: props.eventFeeNotes,
  });
  const display =
    props.eventFeeLabel ??
    formatEventFeeDisplay(form);
  const hasStructuredFee = props.eventFeeType
    ? props.eventFeeType !== 'undecided' && props.eventFeeType !== 'variable'
    : Boolean(props.eventFee && props.eventFee > 0);

  return (
    <div className='grid gap-3 sm:grid-cols-2'>
      <div
        className='rounded-2xl border px-4 py-4'
        style={{ borderColor: `${HK.green}33`, backgroundColor: `${HK.green}0a` }}
      >
        <p className='text-xs font-semibold' style={{ color: HK.green }}>
          {HANAKAI_PARTICIPATION_FEE_LABEL}
        </p>
        <p className='mt-2 text-2xl font-semibold tabular-nums' style={{ color: HK.green }}>
          {formatHanakaiParticipationFee()}
        </p>
        <p className='mt-1 text-xs leading-6 text-[#5b6f67]'>参加メンバーに選ばれた場合のみ自動請求</p>
        <p className='mt-1 text-xs leading-6 text-[#5b6f67]'>選ばれなかった場合、請求は発生しません</p>
      </div>

      <div className='rounded-2xl border border-[#ebe9e4] bg-[#fafaf8] px-4 py-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <p className='text-xs font-semibold text-[#6b6b6b]'>イベント参加費</p>
          <span className='rounded-full border border-[#ddd9d1] bg-white px-2.5 py-0.5 text-[10px] font-semibold text-[#6b6b6b]'>
            当日現地払い
          </span>
        </div>
        <p
          className={`mt-2 font-semibold tabular-nums ${hasStructuredFee || display !== 'イベント詳細をご確認ください' ? 'text-2xl text-[#1a1a1a]' : 'text-sm leading-7 text-[#6b6b6b]'}`}
        >
          {display}
        </p>
        <p className='mt-1 text-xs leading-6 text-[#9a9a9a]'>主催者が設定した金額</p>
        {props.eventFeeIncludes ? (
          <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>
            <span className='font-medium text-[#4a4a4a]'>含む: </span>
            {props.eventFeeIncludes}
          </p>
        ) : null}
        {props.eventFeeExcludes ? (
          <p className='mt-1 text-xs leading-6 text-[#6b6b6b]'>
            <span className='font-medium text-[#4a4a4a]'>含まない: </span>
            {props.eventFeeExcludes}
          </p>
        ) : null}
        {props.eventFeeNotes ? (
          <p className='mt-1 text-xs leading-6 text-[#6b6b6b]'>{props.eventFeeNotes}</p>
        ) : null}
        <p className='mt-2 text-xs leading-6 text-[#6b6b6b]'>
          飲食代・材料費・施設利用料など、当日必要な費用です。主催者または店舗へ直接お支払いください。
        </p>
      </div>
    </div>
  );
}

export function ApplyFeeNotice() {
  return (
    <div className='space-y-3'>
      <div className='rounded-2xl border px-4 py-4' style={{ borderColor: `${HK.green}33`, backgroundColor: `${HK.green}08` }}>
        <p className='text-sm font-semibold' style={{ color: HK.green }}>
          【{HANAKAI_PARTICIPATION_FEE_LABEL}】
        </p>
        <p className='mt-2 text-sm leading-7 text-[#4a4a4a]'>
          イベント参加メンバーに選ばれた場合、
          <br />
          {HANAKAI_PARTICIPATION_FEE_LABEL}として
          <br />
          {formatHanakaiParticipationFee()}を登録済みのお支払い方法へ自動決済します。
        </p>
        <p className='mt-2 text-sm leading-7 text-[#4a4a4a]'>
          ※参加メンバーに選ばれなかった場合は
          <br />
          請求されません。
        </p>
      </div>

      <div className='rounded-2xl border border-[#ebe9e4] bg-[#fafaf8] px-4 py-4'>
        <p className='text-sm font-semibold text-[#1a1a1a]'>【イベント当日の費用について】</p>
        <p className='mt-2 text-sm leading-7 text-[#4a4a4a]'>
          飲食代・材料費・施設利用料などの
          <br />
          イベント参加費は含まれていません。
        </p>
        <p className='mt-2 text-sm leading-7 text-[#4a4a4a]'>
          イベント当日に必要となる費用は、
          <br />
          イベント詳細をご確認ください。
        </p>
        <p className='mt-2 text-sm leading-7 text-[#4a4a4a]'>当日は主催者または店舗へ直接お支払いください。</p>
      </div>
    </div>
  );
}

export function EventPreDescriptionNotice() {
  return (
    <div className='rounded-2xl border border-[#e8dfd0] bg-[#fbf8f3] px-4 py-4 text-sm leading-7 text-[#4a4a4a]'>
      <p className='font-semibold text-[#1a1a1a]'>【ご参加前にご確認ください】</p>
      <ul className='mt-3 list-none space-y-2'>
        <li>・{HANAKAI_PARTICIPATION_FEE_LABEL}{formatHanakaiParticipationFee()}は参加メンバー決定時に自動決済されます。</li>
        <li>・イベント当日に必要な費用は主催者または店舗へ直接お支払いください。</li>
        <li>・イベント参加費の詳細は以下のイベント説明をご確認ください。</li>
      </ul>
    </div>
  );
}

export function CreateEventHanakaiFeeNotice() {
  return (
    <div className='rounded-2xl border border-[#ebe9e4] bg-[#fafaf8] px-4 py-4 text-xs leading-6 text-[#4a4a4a]'>
      <p className='text-sm font-semibold text-[#1a1a1a]'>HANAKAI参加費について</p>
      <p className='mt-2'>
        参加メンバーに選ばれた方には、HANAKAIから参加費{formatHanakaiParticipationFee()}が登録済みカードへ自動請求されます。
      </p>
      <p className='mt-1'>この500円はHANAKAIの参加費であり、主催者への分配はありません。</p>
      <p className='mt-2'>
        イベント当日の飲食代・材料費・施設利用料などは、主催者または店舗が参加者から直接受領してください。
      </p>
    </div>
  );
}

export function CreateEventFeeExplanation() {
  return (
    <div className='mt-3 rounded-2xl border border-[#ebe9e4] bg-[#fafaf8] px-4 py-3 text-xs leading-6 text-[#4a4a4a]'>
      <p>イベント参加費は当日、参加者から直接徴収してください。</p>
      <p className='mt-1'>HANAKAIでは徴収いたしません。</p>
    </div>
  );
}

export function ParticipationDecidedNotice() {
  return (
    <div className='space-y-3'>
      <p className='text-base font-semibold text-[#1a1a1a]'>参加が決定しました！</p>
      <p className='text-sm leading-7 text-[#4a4a4a]'>
        {HANAKAI_PARTICIPATION_FEE_LABEL}
        {formatHanakaiParticipationFee()}の決済が完了しました。
      </p>
      <p className='text-sm leading-7 text-[#4a4a4a]'>
        イベント当日に必要となる費用は、イベント詳細をご確認のうえ、当日主催者または店舗へ直接お支払いください。
      </p>
    </div>
  );
}
