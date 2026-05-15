import Parser from 'rss-parser';

export interface BlogPost {
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  date: string;
  readTime: string;
  link: string;
  slug: string;
  image: string | null;
  accent: string;
  border: string;
}

type FeedItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  contentSnippet?: string;
  'content:encoded'?: string;
  enclosure?: { url?: string };
  mediaContent?: { $?: { url?: string } };
  mediaThumbnail?: { $?: { url?: string } };
  categories?: string[];
  summary?: string;
};

const FEED_URL = 'https://blog.holtzweb.com/feed.xml';
const SITEMAP_URL = 'https://blog.holtzweb.com/sitemap.xml';

const CONCURRENCY = 6;

const categoryStyles: Record<string, { accent: string; border: string }> = {
  linux: { accent: 'text-emerald-400', border: 'border-emerald-500/20' },
  networking: { accent: 'text-violet-400', border: 'border-violet-500/20' },
  devops: { accent: 'text-teal-400', border: 'border-teal-500/20' },
  proxmox: { accent: 'text-amber-400', border: 'border-amber-500/20' },
  browsers: { accent: 'text-indigo-400', border: 'border-indigo-500/20' },
  script: { accent: 'text-lime-400', border: 'border-lime-500/20' },
  wordpress: { accent: 'text-blue-400', border: 'border-blue-500/20' },
  automation: { accent: 'text-cyan-400', border: 'border-cyan-500/20' },
  authentication: { accent: 'text-pink-400', border: 'border-pink-500/20' },
  email: { accent: 'text-rose-400', border: 'border-rose-500/20' },
  monitoring: { accent: 'text-orange-400', border: 'border-orange-500/20' },
  reverseproxy: { accent: 'text-fuchsia-400', border: 'border-fuchsia-500/20' },
  support: { accent: 'text-sky-400', border: 'border-sky-500/20' },
  telemetry: { accent: 'text-teal-300', border: 'border-teal-400/20' },
  tor: { accent: 'text-purple-300', border: 'border-purple-400/20' },
  waf: { accent: 'text-red-300', border: 'border-red-400/20' },
  docker: { accent: 'text-orange-400', border: 'border-orange-500/20' },
  security: { accent: 'text-red-400', border: 'border-red-500/20' },
  install: { accent: 'text-green-400', border: 'border-green-500/20' },
  localrepository: { accent: 'text-emerald-300', border: 'border-emerald-400/20' },
  storage: { accent: 'text-yellow-300', border: 'border-yellow-400/20' },
  dns: { accent: 'text-yellow-400', border: 'border-yellow-500/20' },
  http: { accent: 'text-blue-300', border: 'border-blue-400/20' },
  router: { accent: 'text-violet-300', border: 'border-violet-400/20' },
  unraid: { accent: 'text-orange-300', border: 'border-orange-400/20' },
  vpn: { accent: 'text-green-300', border: 'border-green-400/20' },
  wifi: { accent: 'text-sky-300', border: 'border-sky-400/20' },
  proxmoxbackupserver: { accent: 'text-amber-300', border: 'border-amber-400/20' },
  proxmoxinstall: { accent: 'text-amber-200', border: 'border-amber-300/20' },
  proxmoxnetworking: { accent: 'text-violet-300', border: 'border-violet-400/20' },
  proxmoxstorage: { accent: 'text-yellow-300', border: 'border-yellow-400/20' },
  privacy: { accent: 'text-purple-400', border: 'border-purple-500/20' },
  sidebery: { accent: 'text-indigo-300', border: 'border-indigo-400/20' },
  files: { accent: 'text-lime-300', border: 'border-lime-400/20' },
  default: { accent: 'text-cyan-400', border: 'border-cyan-500/20' },
};

function getCategoryStyles(category: string) {
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(categoryStyles)) {
    if (k !== 'default' && key.includes(k)) return v;
  }
  return categoryStyles.default;
}

function getBestCategory(tags: string[], slug = ''): string {
  const knownCats = Object.keys(categoryStyles).filter((k) => k !== 'default');
  for (const tag of tags) {
    const lower = tag.toLowerCase().trim();
    for (const cat of knownCats) {
      if (lower === cat || lower.includes(cat)) return cat;
    }
  }
  if (tags[0]) return tags[0].toLowerCase().trim();
  const slugLower = slug.toLowerCase();
  for (const cat of knownCats) {
    if (slugLower.includes(cat)) return cat;
  }
  return 'general';
}

function extractImage(item: FeedItem): string | null {
  const thumb = item.mediaThumbnail?.['$']?.url;
  if (thumb) return thumb;
  const media = item.mediaContent?.['$']?.url;
  if (media) return media;
  if (item.enclosure?.url) return item.enclosure.url;
  const content = item['content:encoded'] ?? '';
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1]) return imgMatch[1];
  return null;
}

function countProseWords(html: string): number {
  const noCode = html.replace(/<(pre|code)[^>]*>[\s\S]*?<\/(pre|code)>/gi, ' ');
  const noTags = noCode.replace(/<[^>]+>/g, ' ');
  return noTags.split(/\s+/).filter(Boolean).length;
}

function estimateReadTime(item: FeedItem): string {
  const raw = item['content:encoded'] ?? item.contentSnippet ?? '';
  const words = countProseWords(raw);
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function extractSlug(url: string): string {
  return url.replace(/\/$/, '').split('/').pop() ?? url;
}

function formatDate(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toISOString().slice(0, 10);
}

function buildExcerpt(source: string): string {
  if (!source) return '';
  const trimmed = source.slice(0, 220).trimEnd();
  return trimmed + '…';
}

function feedItemToPost(item: FeedItem, atomTags?: string[]): BlogPost {
  const tags = atomTags && atomTags.length > 0 ? atomTags : (item.categories ?? []);
  const slug = extractSlug(item.link ?? '');
  const category = getBestCategory(tags, slug);
  const styles = getCategoryStyles(category);

  const excerptSource = item.summary || item.contentSnippet || '';

  return {
    title: item.title ?? 'Untitled',
    excerpt: buildExcerpt(excerptSource),
    category,
    tags,
    date: formatDate(item.isoDate ?? item.pubDate ?? ''),
    readTime: estimateReadTime(item),
    link: item.link ?? '#',
    slug: extractSlug(item.link ?? ''),
    image: extractImage(item),
    accent: styles.accent,
    border: styles.border,
  };
}

async function fetchAtomCategories(): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  try {
    const res = await fetch(FEED_URL, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return map;
    const xml = await res.text();
    const entries = [...xml.matchAll(/<entry[\s>]([\s\S]*?)<\/entry>/gi)];
    for (const [, body] of entries) {
      const linkMatch =
        body.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i) ??
        body.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']alternate["']/i);
      if (!linkMatch) continue;
      const terms = [...body.matchAll(/<category[^>]+term=["']([^"']+)["']/gi)]
        .map((m) => m[1].trim())
        .filter(Boolean);
      if (terms.length > 0) map.set(linkMatch[1].trim(), terms);
    }
  } catch {}
  return map;
}

async function fetchSitemapPostUrls(): Promise<string[]> {
  try {
    const res = await fetch(SITEMAP_URL, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return [];
    const xml = await res.text();
    const matches = [...xml.matchAll(/<loc>(https?:\/\/[^<]*\/posts\/[^<]+)<\/loc>/gi)];
    return matches.map((m) => m[1].trim());
  } catch {
    return [];
  }
}

async function scrapePostMeta(url: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const html = await res.text();

    const og = (prop: string) =>
      html.match(new RegExp(`<meta[^>]+property="${prop}"[^>]+content="([^"]+)"`, 'i'))?.[1] ??
      html.match(new RegExp(`<meta[^>]+content="([^"]+)"[^>]+property="${prop}"`, 'i'))?.[1] ??
      '';
    const meta = (name: string) =>
      html.match(new RegExp(`<meta[^>]+name="${name}"[^>]+content="([^"]+)"`, 'i'))?.[1] ??
      html.match(new RegExp(`<meta[^>]+content="([^"]+)"[^>]+name="${name}"`, 'i'))?.[1] ??
      '';

    const title =
      og('og:title') ||
      html
        .match(/<title>([^<]+)<\/title>/i)?.[1]
        ?.replace(/\s*[|–—-].*$/, '')
        .trim() ||
      'Untitled';
    const excerpt = og('og:description') || meta('description') || '';
    const image = og('og:image') || null;
    const rawDate =
      og('article:published_time') ||
      meta('date') ||
      html.match(/<time[^>]+datetime="([^"]+)"/i)?.[1] ||
      '';

    const tagMatches = [
      ...html.matchAll(/<meta[^>]+property="article:tag"[^>]+content="([^"]+)"/gi),
      ...html.matchAll(/<meta[^>]+content="([^"]+)"[^>]+property="article:tag"/gi),
    ];
    const tags = [...new Set(tagMatches.map((m) => m[1]).filter(Boolean))];

    if (tags.length === 0) {
      const ldMatch = html.match(
        /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i
      );
      if (ldMatch) {
        try {
          const ld = JSON.parse(ldMatch[1]);
          const kw: unknown = ld.keywords ?? ld.about;
          if (typeof kw === 'string')
            tags.push(
              ...kw
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            );
          else if (Array.isArray(kw))
            tags.push(...(kw as string[]).filter((s) => typeof s === 'string'));
        } catch {}
      }
    }

    const slug = extractSlug(url);
    const category = getBestCategory(tags, slug);
    const styles = getCategoryStyles(category);

    const bodyMatch = html.match(/<(?:article|main)[^>]*>([\s\S]*?)<\/(?:article|main)>/i);
    const bodyHtml = bodyMatch ? bodyMatch[1] : html;
    const words = countProseWords(bodyHtml);
    const minutes = Math.max(1, Math.round(words / 200));

    return {
      title,
      excerpt: buildExcerpt(excerpt),
      category,
      tags,
      date: formatDate(rawDate),
      readTime: `${minutes} min read`,
      link: url,
      slug: extractSlug(url),
      image,
      accent: styles.accent,
      border: styles.border,
    };
  } catch {
    return null;
  }
}

async function withConcurrency<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    const parser = new Parser<Record<string, unknown>, FeedItem>({
      timeout: 15_000,
      customFields: {
        item: [
          ['media:content', 'mediaContent', { keepArray: false }],
          ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
        ],
      },
    });

    const [feed, sitemapUrls, atomCatMap] = await Promise.all([
      parser.parseURL(FEED_URL),
      fetchSitemapPostUrls(),
      fetchAtomCategories(),
    ]);

    const feedPosts = feed.items.map((item) =>
      feedItemToPost(item, item.link ? atomCatMap.get(item.link) : undefined)
    );
    const feedBySlug = new Map(feedPosts.map((p) => [p.slug, p]));

    const missingUrls = sitemapUrls.filter((url) => {
      const slug = extractSlug(url);
      return !feedBySlug.has(slug);
    });

    const imagelessFeedPosts = feedPosts.filter((p) => !p.image && p.link && p.link !== '#');

    const scrapeUrls = [...missingUrls, ...imagelessFeedPosts.map((p) => p.link)];
    const scrapedBySlug = new Map<string, BlogPost>();
    if (scrapeUrls.length > 0) {
      const tasks = scrapeUrls.map((url) => () => scrapePostMeta(url));
      const results = await withConcurrency(tasks, CONCURRENCY);
      for (const p of results) {
        if (p) scrapedBySlug.set(p.slug, p);
      }
    }

    const mergedFeedPosts = feedPosts.map((p) => {
      if (p.image) return p;
      const scraped = scrapedBySlug.get(p.slug);
      return scraped?.image ? { ...p, image: scraped.image } : p;
    });

    const scrapedPosts = [...scrapedBySlug.values()].filter((p) => !feedBySlug.has(p.slug));

    const allPosts = [...mergedFeedPosts, ...scrapedPosts];

    allPosts.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));

    return allPosts;
  } catch (err) {
    console.warn('[fetchBlog] Could not fetch blog feed:', (err as Error).message);
    return [];
  }
}
