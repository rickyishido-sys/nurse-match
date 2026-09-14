import { LoadingStatus } from '@/components/connection/ui/loading-status';

export default function HomeLoading() {
  return (
    <div className='flex min-h-[50vh] items-center justify-center bg-[#faf7f2] px-6'>
      <LoadingStatus variant='block' label='ホームを読み込み中です' />
    </div>
  );
}
