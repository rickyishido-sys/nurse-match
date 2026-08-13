type LoadingStatusProps = {
  label?: string;
  /** compact = inline chip; block = centered block for full-page loading */
  variant?: 'compact' | 'block';
  className?: string;
};

/** Small, brand-aligned loading cue (spinner + label). */
export function LoadingStatus({
  label = '読み込み中',
  variant = 'compact',
  className = '',
}: LoadingStatusProps) {
  if (variant === 'block') {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 py-6 ${className}`}
        role='status'
        aria-live='polite'
        aria-busy='true'
      >
        <span className='hk-loading-spinner' aria-hidden />
        <p className='text-sm text-[#6b6b6b]'>{label}</p>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-[#ebe9e4] bg-white/90 px-3 py-1.5 text-xs font-medium text-[#6b6b6b] shadow-sm ${className}`}
      role='status'
      aria-live='polite'
      aria-busy='true'
    >
      <span className='hk-loading-spinner hk-loading-spinner--sm' aria-hidden />
      <span>{label}</span>
    </div>
  );
}
