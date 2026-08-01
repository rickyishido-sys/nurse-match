/** HANAKAI charges this when a member is selected for an event (not the event day cost). */
export const HANAKAI_PARTICIPATION_FEE_YEN = 500;

/** Server-side fixed charge amount (Square). Alias for spec compliance. */
export const HANAKAI_PARTICIPATION_FEE_JPY = HANAKAI_PARTICIPATION_FEE_YEN;

export const HANAKAI_PARTICIPATION_FEE_LABEL = 'HANAKAI参加手数料';

export function formatHanakaiParticipationFee(): string {
  return `${HANAKAI_PARTICIPATION_FEE_YEN.toLocaleString('ja-JP')}円`;
}

/** Host-set event day cost (paid on-site to host/venue). */
export function formatEventParticipationFee(fee?: number): string {
  if (!fee || fee <= 0) return 'イベント詳細をご確認ください';
  return `${fee.toLocaleString('ja-JP')}円`;
}
