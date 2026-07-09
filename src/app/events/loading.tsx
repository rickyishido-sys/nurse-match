import { ConnectionShell } from '@/components/connection/shell';

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-[#ebe9e4]/70 ${className ?? ''}`} />;
}

export default function EventsLoading() {
  return (
    <ConnectionShell viewer={null}>
      <div className='space-y-8' aria-busy='true' aria-label='読み込み中'>
        <div className='space-y-3'>
          <SkeletonBlock className='h-3 w-24' />
          <SkeletonBlock className='h-8 w-48' />
          <SkeletonBlock className='h-4 w-full max-w-md' />
        </div>
        <div className='space-y-5'>
          <SkeletonBlock className='h-64 w-full rounded-3xl' />
          <SkeletonBlock className='h-64 w-full rounded-3xl' />
        </div>
      </div>
    </ConnectionShell>
  );
}
