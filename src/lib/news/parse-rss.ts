export type ParsedRssItem = {
  title: string;
  url: string;
  publishedAt: string;
  summary: string;
  source: string;
};

function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '')
    .trim();
}

function pickTag(block: string, tag: string): string {
  const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = block.match(cdata) ?? block.match(plain);
  return match ? decodeEntities(match[1]) : '';
}

function parseDate(raw: string): string {
  if (!raw) return new Date().toISOString();
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function extractGoogleSource(title: string, fallback: string): { title: string; source: string } {
  const parts = title.split(' - ');
  if (parts.length >= 2) {
    const source = parts[parts.length - 1].trim();
    const cleanTitle = parts.slice(0, -1).join(' - ').trim();
    if (source && cleanTitle) return { title: cleanTitle, source };
  }
  return { title, source: fallback };
}

export function parseRssFeed(xml: string, defaultSource: string): ParsedRssItem[] {
  const items: ParsedRssItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  for (const block of blocks) {
    let title = pickTag(block, 'title');
    const link = pickTag(block, 'link') || pickTag(block, 'guid');
    if (!title || !link) continue;

    const pubDate = pickTag(block, 'pubDate') || pickTag(block, 'updated') || pickTag(block, 'dc:date');
    const summary = pickTag(block, 'description') || pickTag(block, 'content:encoded') || pickTag(block, 'summary');
    const sourceTag = pickTag(block, 'source');

    let source = sourceTag || defaultSource;
    if (!sourceTag && defaultSource === 'Google News') {
      const extracted = extractGoogleSource(title, defaultSource);
      title = extracted.title;
      source = extracted.source;
    }

    items.push({
      title,
      url: link,
      publishedAt: parseDate(pubDate),
      summary,
      source,
    });
  }

  return items;
}
