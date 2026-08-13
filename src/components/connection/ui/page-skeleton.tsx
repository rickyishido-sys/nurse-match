import { LoadingStatus } from '@/components/connection/ui/loading-status';

type PageSkeletonProps = {
  lines?: number;
  /** event-detail shaped layout */
  variant?: 'default' | 'event-detail';
  showStatus?: boolean;
};

function Bone({ className }: { className: string }) {
  return <div className={`hk-skeleton-bone ${className}`} aria-hidden />;
}

export function PageSkeleton({
  lines = 4,
  variant = 'default',
  showStatus = true,
}: PageSkeletonProps) {
  if (variant === 'event-detail') {
    return (
      <div className='mx-auto max-w-3xl space-y-6 lg:max-w-4xl' aria-busy='true'>
        {showStatus ? (
          <div className='flex justify-center pt-2'>
            <LoadingStatus label='読み込み中' />
          </div>
        ) : null}
        <Bone className='aspect-[16/10] w-full rounded-3xl' />
        <div className='space-y-3'>
          <Bone className='h-7 w-2/3 max-w-md rounded-lg' />
          <Bone className='h-4 w-full max-w-lg rounded' />
          <Bone className='h-4 w-4/5 max-w-md rounded' />
        </div>
        <div className='grid gap-3 sm:grid-cols-2'>
          <Bone className='h-24 rounded-2xl' />
          <Bone className='h-24 rounded-2xl' />
        </div>
        <Bone className='h-12 w-full rounded-full' />
        {Array.from({ length: Math.max(2, lines - 2) }).map((_, i) => (
          <Bone key={i} className='h-28 rounded-2xl' />
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-4' aria-busy='true'>
      {showStatus ? (
        <div className='flex justify-center sm:justify-start'>
          <LoadingStatus label='読み込み中' />
        </div>
      ) : null}
      <div aria-hidden className='space-y-4'>
        <Bone className='h-8 w-48 rounded-lg' />
        <Bone className='h-4 w-full max-w-md rounded' />
        {Array.from({ length: lines }).map((_, i) => (
          <Bone key={i} className='h-24 rounded-2xl' />
        ))}
      </div>
    </div>
  );
}
