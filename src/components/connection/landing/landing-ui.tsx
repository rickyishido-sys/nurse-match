/** LP共通 — 参考デザインのゴールド・セリフ見出し */
export const LP_GOLD = '#b8956a';
export const LP_GOLD_LIGHT = '#c5a059';

export function LandingSectionTitle({
  kicker,
  title,
  center = true,
}: {
  kicker: string;
  title: string;
  center?: boolean;
}) {
  return (
    <div className={`space-y-2 ${center ? 'text-center' : ''}`}>
      <p className='text-xs font-medium tracking-[0.12em]' style={{ color: LP_GOLD }}>
        {kicker}
      </p>
      <h2 className='font-serif text-[1.15rem] font-semibold leading-snug tracking-tight text-[#1a1a1a] sm:text-[1.25rem]'>
        {title}
      </h2>
    </div>
  );
}
