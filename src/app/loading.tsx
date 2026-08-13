import { LoadingStatus } from '@/components/connection/ui/loading-status';

export default function HomeLoading() {
  return (
    <div className='mx-auto flex min-h-[50vh] max-w-[390px] items-center justify-center px-5 md:max-w-[768px] lg:max-w-[1200px]'>
      <LoadingStatus variant='block' label='読み込み中' />
    </div>
  );
}
