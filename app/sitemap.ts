import type { MetadataRoute } from 'next';

import { normaliseSlug, pages } from '@/lib/content';
import { absoluteUrl } from '@/lib/seo';

/** Every page in content/pages.json, home first. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return pages.map((page) => {
    const slug = normaliseSlug(page.slug);
    return {
      url: absoluteUrl(slug),
      lastModified: now,
      changeFrequency: slug === '/' ? ('weekly' as const) : ('monthly' as const),
      priority: slug === '/' ? 1 : 0.7,
    };
  });
}
