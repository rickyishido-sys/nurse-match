import { redirect } from 'next/navigation';

export default async function LegacyChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  redirect(`/chats/${matchId}`);
}
