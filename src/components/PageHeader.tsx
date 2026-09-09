import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { MediaImage } from '@/components/ui/MediaImage';

/**
 * The top of every page that is not the homepage: the breadcrumb, the one `h1`
 * and the sentence that says what the page is for.
 *
 * Centralised so the document outline cannot drift page by page — this is the
 * only place a page-level `h1` is written, which is what keeps "exactly one
 * `h1`, and it says what the page is" true across twenty-odd routes.
 *
 * The breadcrumb is a real `<nav>` with an ordered list. The current page is the
 * last item and is not a link, marked `aria-current="page"` rather than styled
 * differently and left ambiguous.
 */
export type Crumb = { label: string; to: string };

export type PageHeaderProps = {
  /** Small line above the title. Category, division, deal type — never a claim. */
  eyebrow?: string | undefined;
  title: string;
  /** Id the surrounding section points `aria-labelledby` at. */
  titleId?: string | undefined;
  lede?: string | undefined;
  crumbs?: readonly Crumb[] | undefined;
  /** Image slug, resolved through `getMedia`. */
  imageSlug?: string | undefined;
  imageAlt?: string | undefined;
  /** Buttons, links, anything that belongs under the lede. */
  children?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  titleId = 'page-title',
  lede,
  crumbs,
  imageSlug,
  imageAlt,
  children,
}: PageHeaderProps) {
  const hasImage = Boolean(imageSlug);

  return (
    <section aria-labelledby={titleId} className="border-b border-stone-200 bg-stone-50">
      <Container
        className={
          hasImage
            ? 'grid items-center gap-10 py-12 md:py-16 lg:grid-cols-2 lg:gap-16'
            : 'py-12 md:py-16'
        }
      >
        <div>
          {crumbs && crumbs.length > 0 ? (
            <nav aria-label="מיקום באתר" className="mb-6">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-ink-600">
                {crumbs.map((crumb, index) => {
                  const isLast = index === crumbs.length - 1;

                  return (
                    <li key={crumb.to} className="flex items-center gap-2">
                      {isLast ? (
                        <span aria-current="page">{crumb.label}</span>
                      ) : (
                        <Link
                          to={crumb.to}
                          className="text-brand-700 underline underline-offset-4 hover:text-ink-900"
                        >
                          {crumb.label}
                        </Link>
                      )}
                      {isLast ? null : (
                        <span aria-hidden="true" className="text-ink-400">
                          ·
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          ) : null}

          {eyebrow ? (
            <p className="text-small font-semibold tracking-[0.2em] text-brand-700">{eyebrow}</p>
          ) : null}

          <Heading level={1} id={titleId} className="mt-3">
            {title}
          </Heading>

          {lede ? <p className="mt-5 max-w-prose text-body text-ink-600">{lede}</p> : null}

          {children ? <div className="mt-8">{children}</div> : null}
        </div>

        {imageSlug ? (
          <MediaImage
            slug={imageSlug}
            alt={imageAlt ?? ''}
            aspect="4:3"
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="w-full"
          />
        ) : null}
      </Container>
    </section>
  );
}
