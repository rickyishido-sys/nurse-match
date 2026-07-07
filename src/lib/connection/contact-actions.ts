'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  CONTACT_INQUIRY_CATEGORIES,
  type ContactInquiryCategory,
} from '@/lib/connection/contact-inquiry-constants';
import { submitContactInquiry } from '@/lib/connection/contact-inquiry';
import { getViewerMemberId } from '@/lib/connection/identity';

const VALID_CATEGORIES = new Set(CONTACT_INQUIRY_CATEGORIES.map((c) => c.value));

export async function submitContactInquiryAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const category = String(formData.get('category') ?? '').trim() as ContactInquiryCategory;
  const message = String(formData.get('message') ?? '').trim();

  if (!name || !email || !message) {
    redirect('/contact?error=required');
  }
  if (!VALID_CATEGORIES.has(category)) {
    redirect('/contact?error=invalid_category');
  }

  const memberId = await getViewerMemberId();

  await submitContactInquiry({ memberId, name, email, category, message });

  redirect('/contact?sent=1');
}
