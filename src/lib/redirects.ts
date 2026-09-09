import { legacyDealTerms, listingPath, listings, dealTypePath } from '@/content/listings';
import { postPath, posts } from '@/content/posts';
import { services, servicePath } from '@/content/services';
import { testimonialLegacyPaths } from '@/content/testimonials';

/**
 * The legacy URL map.
 *
 * The site being replaced is a 2015-era WordPress build with Hebrew permalinks,
 * which means every one of its URLs is a long percent-encoded string
 * (`/%d7%a6%d7%95%d7%a8-%d7%a7%d7%a9%d7%a8/`). Ten years of links, citations and
 * accumulated ranking point at those strings. A path that is not in this map is
 * a 404 on the day we cut over, and a page that falls out of the index shortly
 * after.
 *
 * HOW IT IS BUILT. Most entries are not written here at all: they are derived
 * from the `legacyPaths` recorded on each service, listing and post, and from
 * the testimonial permalink table. Content and redirects therefore cannot drift
 * apart — adding a page with its old URL wires the redirect automatically.
 * `PAGE_REDIRECTS` below holds only what no content record owns: section hubs,
 * archives, the taxonomy pages and the search results page.
 *
 * KEYS ARE STORED DECODED. `/צור-קשר/` rather than the percent-encoded form —
 * legible, diffable, and impossible to get subtly wrong by hand. `normalizePath`
 * decodes whatever arrives, so both forms resolve.
 *
 * DELIBERATELY ABSENT: the WordPress login and registration endpoints that the
 * legacy homepage exposed. They are not content, they carry no search equity,
 * and mapping them would keep a dead authentication surface alive in a static
 * site. They are gone, and should answer 410.
 */

/** Every path this map is allowed to send a visitor to. */
export const SITE_ROUTES = [
  '/',
  '/about',
  '/management',
  '/construction',
  '/investment',
  '/contact',
  '/listings',
  '/testimonials',
  '/blog',
  '/news',
  '/accessibility',
  '/privacy',
] as const;

/** Route patterns whose targets are validated against their content module. */
const DYNAMIC_PREFIXES = [
  '/listings/',
  '/testimonials/',
  '/blog/',
  '/news/',
  '/services/',
] as const;

/**
 * Legacy paths with no content record of their own.
 *
 * The three division hubs, and the service pages beneath them, live on their
 * `Service` records instead; these are the pieces of the old information
 * architecture that did not survive as pages.
 */
const PAGE_REDIRECTS: Readonly<Record<string, string>> = {
  '/ממליצים/': '/testimonials',

  // The about section. Its WordPress parent slug was itself a keyword string:
  // "קבוצת קיסר ניהול נכסים פתרונות בניה וע…", truncated mid-word by WordPress.
  '/קבוצת-קיסר-ניהול-נכסים-פתרונות-בניה-וע/': '/about',
  '/קבוצת-קיסר-ניהול-נכסים-פתרונות-בניה-וע/דבר-המנכל/': '/about#ceo',
  // Labelled "קיסר בתקשורת" in the navigation, despite the slug.
  '/קבוצת-קיסר-ניהול-נכסים-פתרונות-בניה-וע/שיווק-ניהול-נכסים-מסחריים/': '/about#press',
  '/קבוצת-קיסר-ניהול-נכסים-פתרונות-בניה-וע/agents/': '/contact',
  '/קבוצת-קיסר-ניהול-נכסים-פתרונות-בניה-וע/דרושים/': '/contact',

  '/צור-קשר/': '/contact',

  // The listings index. WordPress served it from the search-results page.
  '/search-results/': '/listings',
  // "נכס החודש" was a rotating featured property, not a page of its own.
  '/ניהול-נכסים-ניהול-נכסים/ניהול-נכסים-נכס-החודש/': '/listings',

  '/נדלן-בניה-ניהול-יזמות/פרויקטים/': '/construction',
  '/נדלן-בניה-ניהול-יזמות/פרוייקט-החודש/': '/construction',

  '/category/בלוג/': '/blog',
  '/category/מה-חדש/': '/news',
};

function buildRedirects(): Map<string, string> {
  const map = new Map<string, string>();

  const add = (from: string, to: string): void => {
    const key = normalizePath(from);
    const existing = map.get(key);
    if (existing && existing !== to) {
      // Two content records claiming one legacy URL is a data bug, not a runtime
      // condition: fail loudly at import time rather than pick a winner.
      throw new Error(`Duplicate legacy path ${key}: mapped to both ${existing} and ${to}`);
    }
    map.set(key, to);
  };

  for (const [from, to] of Object.entries(PAGE_REDIRECTS)) add(from, to);

  for (const service of services) {
    for (const legacy of service.legacyPaths) add(legacy, servicePath(service.slug));
  }

  for (const listing of listings) {
    for (const legacy of listing.legacyPaths) add(legacy, listingPath(listing.slug));
  }

  for (const post of posts) {
    for (const legacy of post.legacyPaths) add(legacy, postPath(post));
  }

  for (const [slug, legacy] of Object.entries(testimonialLegacyPaths)) {
    add(legacy, `/testimonials/${slug}`);
  }

  // The `property_buyorrent` taxonomy archives become filters on the listings
  // index. The legacy site linked some of these with a trailing slash and some
  // without; normalisation makes both forms one key.
  for (const [term, deal] of Object.entries(legacyDealTerms)) {
    add(`/property_buyorrent/${term}/`, dealTypePath(deal));
  }

  return map;
}

export const redirects: ReadonlyMap<string, string> = buildRedirects();

/**
 * Reduce any incoming URL or path to the form used as a map key.
 *
 * Percent-decoded, query and fragment removed, duplicate slashes collapsed, and
 * the trailing slash dropped (except at the root). Trailing slashes matter here:
 * WordPress emitted them, some inbound links dropped them, and both must land.
 */
export function normalizePath(input: string): string {
  let path = input.trim();

  // Accept an absolute URL as readily as a path.
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      /* fall through and treat it as a path */
    }
  }

  const cut = path.search(/[?#]/);
  if (cut !== -1) path = path.slice(0, cut);

  try {
    path = decodeURIComponent(path);
  } catch {
    // Malformed escape sequences: keep the raw form rather than throwing on a
    // request we did not construct.
  }

  path = path.replace(/\/{2,}/g, '/');
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.length > 1) path = path.replace(/\/+$/, '');

  return path === '' ? '/' : path;
}

/**
 * The new path for a legacy URL, or `null` if it is not a legacy URL.
 *
 * `null` means "not ours to redirect" — the caller should 404 rather than guess.
 * Returning the homepage for anything unrecognised is a soft-404 pattern that
 * search engines penalise and that strands the visitor.
 */
export function resolveRedirect(input: string): string | null {
  return redirects.get(normalizePath(input)) ?? null;
}

export type RedirectRule = {
  /** Percent-encoded, as a server config and a browser both expect it. */
  source: string;
  destination: string;
  permanent: true;
};

/**
 * The map as host redirect rules — `vercel.json`, `_redirects`, an nginx map.
 *
 * Every rule is a 301: this is a permanent move, and a 302 would hold the old
 * URL in the index while the new one waits behind it.
 */
export function redirectRules(): RedirectRule[] {
  return [...redirects.entries()]
    .map(([from, to]) => ({
      source: encodePath(from),
      destination: to,
      permanent: true as const,
    }))
    .sort((a, b) => a.source.localeCompare(b.source));
}

/** Percent-encode each path segment, leaving the separators alone. */
export function encodePath(path: string): string {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

/** Is this one of the paths the map is allowed to target? */
export function isKnownRoute(path: string): boolean {
  // Strip both query and fragment: '/about#ceo' targets the '/about' page.
  const [pathname] = path.split(/[?#]/) as [string, ...string[]];
  if ((SITE_ROUTES as readonly string[]).includes(pathname)) return true;
  return DYNAMIC_PREFIXES.some(
    (prefix) => pathname.startsWith(prefix) && pathname.length > prefix.length,
  );
}
