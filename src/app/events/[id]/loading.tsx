import { PageSkeleton } from '@/components/connection/ui/page-skeleton';

export default function EventDetailLoading() {
  return (
    <div className='px-5 py-8'>
      <PageSkeleton variant='event-detail' lines={5} />
    </div>
  );
}
