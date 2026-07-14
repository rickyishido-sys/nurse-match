import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';
import { listEvents } from '@/lib/connection/repo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/events`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/legal/tokushoho`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/community-guidelines`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  try {
    const events = await listEvents();
    const eventPages = events
      .filter((e) => !e.isPast && e.status !== 'cancelled' && e.status !== 'closed')
      .slice(0, 100)
      .map((e) => ({
        url: `${SITE_URL}/events/${e.id}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    return [...staticPages, ...eventPages];
  } catch {
    return staticPages;
  }
}
