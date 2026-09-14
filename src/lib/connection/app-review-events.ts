/**
 * App Store / review-only event helpers.
 * Keep review demo data accessible to review accounts, but out of public listings.
 */

const REVIEW_EVENT_TITLES = new Set([
  'HANAKAI App Review Demo Event',
  'HANAKAI Community Review Demo',
]);

const REVIEW_EMAIL_EXACT = new Set([
  'appstore-review@hanakai.kranz.design',
  'review-host@hanakai.kranz.design',
  'appstore-review-demo-a@hanakai.kranz.design',
  'appstore-review-demo-b@hanakai.kranz.design',
]);

export function isAppReviewOnlyEvent(event: {
  title?: string | null;
  conditions?: string | null;
  description?: string | null;
}): boolean {
  const title = (event.title ?? '').trim();
  if (REVIEW_EVENT_TITLES.has(title)) return true;
  if (/App Review|Review Demo/i.test(title)) return true;
  const haystack = `${event.conditions ?? ''}\n${event.description ?? ''}`;
  if (/App Store Review専用|App Store審査用|App Review専用/i.test(haystack)) return true;
  return false;
}

export function isAppReviewViewerEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (REVIEW_EMAIL_EXACT.has(normalized)) return true;
  if (normalized.endsWith('@hanakai.kranz.design') && normalized.includes('review')) return true;
  return false;
}

/** Public listings: hide review-only events unless the viewer is a review account. */
export function filterPublicEvents<
  T extends { title?: string | null; conditions?: string | null; description?: string | null },
>(events: T[], viewerEmail?: string | null): T[] {
  if (isAppReviewViewerEmail(viewerEmail)) return events;
  return events.filter((event) => !isAppReviewOnlyEvent(event));
}
