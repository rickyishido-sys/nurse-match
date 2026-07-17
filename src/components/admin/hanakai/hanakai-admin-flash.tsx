'use client';

type Props = {
  variant: 'success' | 'error';
  message: string;
};

export function AdminFlashBanner({ variant, message }: Props) {
  const styles =
    variant === 'success'
      ? 'border-[#c8e6d9] bg-[#eef8f3] text-[#1f5d4f]'
      : 'border-[#f0d4d4] bg-[#fdf5f5] text-[#8b3a3a]';

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles}`} role='status'>
      {message}
    </div>
  );
}
