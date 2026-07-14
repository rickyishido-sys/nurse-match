import { PageSkeleton } from '@/components/connection/ui/page-skeleton';

export default function ExperienceRequestLoading() {
  return (
    <div className='px-5 py-8'>
      <PageSkeleton lines={8} />
    </div>
  );
}
