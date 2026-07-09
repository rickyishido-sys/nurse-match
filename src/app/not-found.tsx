import { BrandNotFoundContent } from '@/components/connection/brand/brand-not-found';
import { getHanakaiViewer } from '@/lib/hanakai/session';

export default async function NotFound() {
  const viewer = await getHanakaiViewer();
  return <BrandNotFoundContent viewer={viewer} />;
}
