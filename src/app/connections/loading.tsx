import { LoadingStatus } from '@/components/connection/ui/loading-status';

export default function ConnectionsLoading() {
  return (
    <div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#faf7f2] px-5'>
      <p className='text-sm font-semibold tracking-[0.18em] text-[#1f5d4f]'>HANAKAI</p>
      <LoadingStatus variant='block' label='読み込み中' />
    </div>
  );
}
