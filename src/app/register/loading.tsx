import { PageSkeleton } from '@/components/connection/ui/page-skeleton';

export default function RegisterLoading() {
  return (
    <div className='flex min-h-[60vh] items-center justify-center px-5'>
      <div className='w-full max-w-md'>
        <PageSkeleton lines={5} />
      </div>
    </div>
  );
}
