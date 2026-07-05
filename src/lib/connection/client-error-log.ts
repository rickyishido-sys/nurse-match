'use server';

export async function logCreateEventClientError(payload: { message: string; digest?: string | null }) {
  console.error('EVENTS_CREATE_CLIENT_ERROR', payload);
}
