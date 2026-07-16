export type ExternalRecruitment = 'hanakai_only' | 'multi_channel';
export type BillingTarget = 'host' | 'venue';
export type CheckinMethod = 'code' | 'manual';
export type CheckinStatus = 'checked_in' | 'cancelled';
export type RevenueReportStatus = 'draft' | 'submitted' | 'revision_requested' | 'approved' | 'rejected';
export type InvoicePaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export type EventOperationsMeta = {
  externalRecruitment: ExternalRecruitment;
  venuePermissionConfirmed: boolean;
  venueFeeExplained: boolean;
  billingTarget: BillingTarget;
  venueBillingName?: string | null;
  venueBillingContact?: string | null;
  venueBillingPhone?: string | null;
  venueBillingEmail?: string | null;
  venueBillingAddress?: string | null;
  venueBillingConsent: boolean;
  hasCheckinCode: boolean;
  endedAt?: string | null;
  revenueReportRequestedAt?: string | null;
  startAt?: string | null;
};

export type EventCheckin = {
  id: string;
  eventId: string;
  memberId: string;
  applicationId?: string | null;
  method: CheckinMethod;
  status: CheckinStatus;
  checkedInAt: string;
  checkedInByMemberId?: string | null;
  cancelledAt?: string | null;
  cancelledByMemberId?: string | null;
};

export type ReferralFeeBreakdown = {
  totalParticipants: number;
  hanakaiCheckinCount: number;
  grossSalesTaxIncluded: number;
  salesTaxRate: number;
  billingTaxRate: number;
  grossSalesTaxExcluded: number;
  referralRatio: number;
  hanakaiTargetSales: number;
  serviceFeeTaxExcluded: number;
  taxAmount: number;
  totalAmountTaxIncluded: number;
  formulaNotes: string[];
};

export type EventRevenueReport = {
  id: string;
  eventId: string;
  reportedByMemberId?: string | null;
  totalParticipants: number;
  grossSalesTaxIncluded: number;
  salesTaxRate: number;
  billingTaxRate: number;
  notes?: string | null;
  status: RevenueReportStatus;
  adminMemo?: string | null;
  revisionReason?: string | null;
  submittedAt: string;
  approvedAt?: string | null;
  breakdown?: ReferralFeeBreakdown;
  documents?: EventRevenueDocument[];
};

export type EventRevenueDocument = {
  id: string;
  reportId: string;
  storagePath: string;
  documentUrl?: string | null;
  documentType: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export type EventInvoice = {
  id: string;
  invoiceNumber: string;
  eventId: string;
  reportId: string;
  billingTarget: BillingTarget;
  billingName: string;
  billingContact?: string | null;
  billingPhone?: string | null;
  billingEmail?: string | null;
  billingAddress?: string | null;
  hanakaiCheckinCount: number;
  totalParticipants: number;
  grossSalesTaxExcluded: number;
  referralRatio: number;
  hanakaiTargetSales: number;
  serviceFeeTaxExcluded: number;
  salesTaxRate: number;
  billingTaxRate: number;
  taxAmount: number;
  totalAmountTaxIncluded: number;
  invoiceDate: string;
  dueDate: string;
  paymentStatus: InvoicePaymentStatus;
  stripeInvoiceId?: string | null;
  adminMemo?: string | null;
};

export type CreateEventOperationsInput = {
  externalRecruitment: ExternalRecruitment;
  venuePermissionConfirmed: boolean;
  venueFeeExplained: boolean;
  billingTarget: BillingTarget;
  venueBillingName?: string;
  venueBillingContact?: string;
  venueBillingPhone?: string;
  venueBillingEmail?: string;
  venueBillingAddress?: string;
  venueBillingConsent?: boolean;
  /** Server-side only: reuse credentials so API can return plaintext once */
  precomputedCheckin?: { code: string; hash: string };
};

export const EXTERNAL_RECRUITMENT_LABEL: Record<ExternalRecruitment, string> = {
  hanakai_only: 'HANAKAIのみ',
  multi_channel: '他サービス・SNSでも募集',
};

export const BILLING_TARGET_LABEL: Record<BillingTarget, string> = {
  host: '主催者へ請求',
  venue: '店舗・会場へ請求',
};

export const REVENUE_REPORT_STATUS_LABEL: Record<RevenueReportStatus, string> = {
  draft: '下書き',
  submitted: '提出済み',
  revision_requested: '修正依頼',
  approved: '承認済み',
  rejected: '却下',
};

export const INVOICE_PAYMENT_STATUS_LABEL: Record<InvoicePaymentStatus, string> = {
  pending: '未払い',
  paid: '支払済み',
  overdue: '期限超過',
  cancelled: '取消',
};
