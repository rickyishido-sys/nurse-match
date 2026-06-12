import { redirect } from 'next/navigation';

export default async function RejectedPage() {
  redirect('/review-rejected');
}
