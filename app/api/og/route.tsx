/**
 * OG image route: /api/og?slug=/some-page
 *
 * Text comes from content/pages.json, so a page's social card cannot drift
 * from its metadata.
 *
 * Two things here are not obvious:
 *   - the font is baked in as static WOFF (lib/og-font.ts) because satori
 *     reads neither WOFF2 nor variable fonts;
 *   - the text is pre-reordered to visual order (lib/og-bidi.ts) because
 *     satori does not implement the bidi algorithm.
 */
import { ImageResponse } from 'next/og';

import { getPage, normaliseSlug, site } from '@/lib/content';
import { visualLines } from '@/lib/og-bidi';
import { heeboFonts } from '@/lib/og-font';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

const PADDING = 80;
const CONTENT_WIDTH = size.width - PADDING * 2;

export async function GET(request: Request) {
  const slug = normaliseSlug(new URL(request.url).searchParams.get('slug') ?? '/');
  const page = getPage(slug);

  const titleLines = visualLines(page?.title ?? site.name, {
    fontSize: 78,
    maxWidth: CONTENT_WIDTH,
    maxLines: 3,
  });
  const bodyLines = visualLines(page?.metaDescription ?? site.description, {
    fontSize: 32,
    maxWidth: CONTENT_WIDTH,
    maxLines: 3,
  });
  const [brand] = visualLines(site.name, { fontSize: 28, maxWidth: CONTENT_WIDTH, maxLines: 1 });
  const [tagline] = visualLines(site.tagline, {
    fontSize: 26,
    maxWidth: CONTENT_WIDTH,
    maxLines: 1,
  });

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        width: '100%',
        height: '100%',
        padding: PADDING,
        backgroundColor: '#101317',
        color: '#f7f5f1',
        fontFamily: 'Heebo',
      }}
    >
      <div style={{ display: 'flex', fontSize: 28, opacity: 0.65 }}>{brand}</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        {titleLines.map((line) => (
          <div
            key={line}
            style={{ display: 'flex', fontSize: 78, lineHeight: 1.18, fontWeight: 700 }}
          >
            {line}
          </div>
        ))}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            marginTop: 24,
          }}
        >
          {bodyLines.map((line) => (
            <div
              key={line}
              style={{ display: 'flex', fontSize: 32, lineHeight: 1.45, opacity: 0.72 }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', fontSize: 26, opacity: 0.5 }}>{tagline}</div>
    </div>,
    {
      ...size,
      fonts: heeboFonts(),
      headers: {
        'cache-control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  );
}
