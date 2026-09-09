import { Head } from 'vite-react-ssg';

import { SITE_ORIGIN } from '@/lib/structured-data';

const SITE_NAME = 'קבוצת קיסר';

/**
 * Per-page document head.
 *
 * Every route is prerendered, so what is set here ends up in the static HTML a
 * crawler receives — which is the whole reason this build is not a client-side
 * SPA. A property-marketing business lives on organic search.
 *
 * `title` is the page's own name; the group name is appended once, here, so no
 * page can forget it or double it up.
 */
export type SeoProps = {
  title: string;
  description: string;
  /**
   * Canonical path, e.g. `/management`. Omit on pages that should not be
   * indexed. The origin comes from `SITE_ORIGIN`, the same constant the
   * JSON-LD uses — a canonical on one host and structured data on another
   * splits the page's signals between two URLs.
   */
  path?: string | undefined;
  noIndex?: boolean | undefined;
};

export function Seo({ title, description, path, noIndex = false }: SeoProps) {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;

  return (
    <Head>
      <html lang="he" dir="rtl" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {path ? <link rel="canonical" href={`${SITE_ORIGIN}${path}`} /> : null}
      {noIndex ? <meta name="robots" content="noindex, follow" /> : null}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="he_IL" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
    </Head>
  );
}
