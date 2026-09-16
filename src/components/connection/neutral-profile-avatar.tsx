type NeutralProfileAvatarProps = {
  size?: number;
  className?: string;
  rounded?: 'full' | '2xl';
  /** decorative unless a label is provided */
  label?: string;
};

/** HANAKAI 共通の人物非写実アイコン。性別・名前では切り替えない。 */
export function NeutralProfileAvatar({
  size = 40,
  className = '',
  rounded = 'full',
  label,
}: NeutralProfileAvatarProps) {
  const px = `${size}px`;
  const radius = rounded === 'full' ? 'rounded-full' : 'rounded-2xl';

  return (
    <span
      data-testid='neutral-profile-avatar'
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${radius} ${className}`}
      style={{ width: px, height: px, background: 'linear-gradient(180deg, #eef4f1 0%, #e4ece8 100%)' }}
    >
      <svg viewBox='0 0 48 48' width={size} height={size} fill='none' aria-hidden>
        <circle cx='24' cy='24' r='24' fill='#e8f0ec' />
        <circle cx='24' cy='18' r='7.2' fill='#1f5d4f' fillOpacity='0.28' />
        <path
          d='M10.5 40.5c1.8-8.2 7.6-12.4 13.5-12.4s11.7 4.2 13.5 12.4'
          fill='#1f5d4f'
          fillOpacity='0.28'
        />
      </svg>
    </span>
  );
}
