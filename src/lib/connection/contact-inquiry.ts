import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  CONTACT_INQUIRY_CATEGORY_LABEL,
  type ContactInquiryCategory,
  type ContactInquiryStatus,
} from '@/lib/connection/contact-inquiry-constants';

export type { ContactInquiryCategory, ContactInquiryStatus } from '@/lib/connection/contact-inquiry-constants';
export {
  CONTACT_INQUIRY_CATEGORIES,
  CONTACT_INQUIRY_CATEGORY_LABEL,
  CONTACT_INQUIRY_STATUS_LABEL,
} from '@/lib/connection/contact-inquiry-constants';

export type SubmitContactInquiryInput = {
  memberId: string | null;
  name: string;
  email: string;
  category: ContactInquiryCategory;
  message: string;
};

export async function submitContactInquiry(input: SubmitContactInquiryInput): Promise<void> {
  const sb = await createServerSupabaseClient();
  if (!sb) throw new Error('Supabase client unavailable');

  const { error } = await sb.from('hanakai_contact_inquiries').insert({
    member_id: input.memberId,
    name: input.name,
    email: input.email,
    category: input.category,
    message: input.message,
    status: 'new',
  });

  if (error) {
    console.error('HANAKAI_CONTACT_INQUIRY_INSERT_FAILED', {
      memberId: input.memberId,
      category: input.category,
      message: error.message,
      code: error.code,
    });
    throw new Error('お問い合わせの送信に失敗しました');
  }
}

export type AdminInquiryRow = {
  id: string;
  memberId: string | null;
  name: string;
  email: string;
  category: ContactInquiryCategory;
  categoryLabel: string;
  message: string;
  status: ContactInquiryStatus;
  createdAt: string;
  updatedAt: string;
};

export async function listHanakaiAdminInquiries(options?: {
  status?: ContactInquiryStatus | 'all';
}): Promise<AdminInquiryRow[]> {
  const admin = createAdminSupabaseClient();
  if (!admin) return [];

  try {
    let q = admin.from('hanakai_contact_inquiries').select('*').order('created_at', { ascending: false });
    const statusFilter = options?.status ?? 'all';
    if (statusFilter !== 'all') {
      q = q.eq('status', statusFilter);
    }

    const { data, error } = await q;
    if (error || !data) {
      console.warn('HANAKAI_ADMIN_INQUIRIES_LIST_SKIP', { message: error?.message });
      return [];
    }

    return data.map((row) => {
      const category = String(row.category) as ContactInquiryCategory;
      return {
        id: String(row.id),
        memberId: row.member_id ? String(row.member_id) : null,
        name: String(row.name),
        email: String(row.email),
        category,
        categoryLabel: CONTACT_INQUIRY_CATEGORY_LABEL[category] ?? category,
        message: String(row.message),
        status: row.status as ContactInquiryStatus,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at ?? row.created_at),
      };
    });
  } catch (e) {
    console.warn('HANAKAI_ADMIN_INQUIRIES_LIST_FAILED', { error: String(e) });
    return [];
  }
}

export async function adminResolveInquiry(inquiryId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminSupabaseClient();
  if (!admin) return { ok: false, error: 'admin_client_unavailable' };

  const { error } = await admin
    .from('hanakai_contact_inquiries')
    .update({ status: 'resolved', updated_at: new Date().toISOString() })
    .eq('id', inquiryId);

  if (error) {
    console.error('HANAKAI_ADMIN_INQUIRY_RESOLVE_FAILED', { inquiryId, message: error.message });
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
