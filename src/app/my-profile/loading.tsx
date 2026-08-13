import { PageSkeleton } from '@/components/connection/ui/page-skeleton';

export default function MyProfileLoading() {
  return (
    <div className='mx-auto max-w-[390px] px-5 py-8 md:max-w-[768px] lg:max-w-[1200px]'>
      <PageSkeleton lines={5} />
    </div>
  );
}
