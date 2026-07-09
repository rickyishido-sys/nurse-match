import { EventNotFoundContent } from '@/components/connection/brand/event-not-found';
import { getHanakaiViewer } from '@/lib/hanakai/session';

export default async function EventNotFound() {
  const viewer = await getHanakaiViewer();
  return <EventNotFoundContent viewer={viewer} />;
}
