import { Link } from 'react-router-dom';

import { JsonLd } from '@/components/JsonLd';
import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Heading } from '@/components/ui/Heading';
import { Prose } from '@/components/ui/Prose';
import { Section } from '@/components/ui/Section';
import { blogPosts, hasRealDate, hasRealExcerpt, newsPosts, postPath } from '@/content/posts';
import type { Post } from '@/content/types';
import { buildBreadcrumbs } from '@/lib/structured-data';

/**
 * The blog and news archives.
 *
 * What is NOT rendered here matters more than what is. The content layer has
 * each post's title and permalink and nothing else, and it says so in the data
 * rather than papering over it:
 *
 *  - `publishedAt` is the `PENDING_DATE` sentinel on every record. `hasRealDate`
 *    gates the `<time>` element, so no post shows a date until a real one
 *    arrives. A plausible fake date becomes a fact the moment it is printed —
 *    and a wrong date on a news item is a claim about when something happened.
 *  - `excerpt` repeats the title where no teaser was published. `hasRealExcerpt`
 *    gates the teaser, so the archive shows each title once instead of twice.
 *
 * Ordering is the array order, which is the client's own newest-first sequence
 * from their homepage carousels. Sorting by `publishedAt` would sort by a
 * sentinel and shuffle the archive into a meaningless order.
 */
export type PostArchiveProps = {
  kind: Post['kind'];
};

const archive = {
  blog: {
    posts: blogPosts,
    path: '/blog',
    title: 'הבלוג של קיסר',
    eyebrow: 'בלוג',
    lede: 'מאמרים על ניהול נכסים, השקעות נדל״ן, בנייה והתחדשות עירונית.',
    description:
      'הבלוג של קבוצת קיסר — מאמרים על ניהול נכסים, השקעות נדל״ן, בנייה והתחדשות עירונית.',
  },
  news: {
    posts: newsPosts,
    path: '/news',
    title: 'חדשות קיסר',
    eyebrow: 'חדשות',
    lede: 'עדכונים מהקבוצה: שירותים חדשים, פרויקטים וזכיינות.',
    description: 'חדשות קבוצת קיסר — עדכונים על שירותים, פרויקטים וזכיינות.',
  },
} as const;

export function PostArchive({ kind }: PostArchiveProps) {
  const section = archive[kind];

  return (
    <>
      <Seo title={section.title} description={section.description} path={section.path} />
      <JsonLd
        data={buildBreadcrumbs([
          { name: 'דף הבית', path: '/' },
          { name: section.title, path: section.path },
        ])}
      />

      <PageHeader
        eyebrow={section.eyebrow}
        title={section.title}
        lede={section.lede}
        crumbs={[
          { label: 'דף הבית', to: '/' },
          { label: section.title, to: section.path },
        ]}
      />

      <Section labelledBy="archive-title" tone="default">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <Heading level={2} id="archive-title">
            כל הפרסומים
          </Heading>
          <p className="tabular text-small text-ink-600">{section.posts.length} פרסומים</p>
        </div>

        <ul className="mt-8 grid gap-x-10 gap-y-6 md:grid-cols-2">
          {section.posts.map((post) => (
            <li key={post.slug} className="border-b border-stone-200 pb-6">
              <article>
                {hasRealDate(post) ? (
                  <p className="text-small text-ink-600">
                    <time dateTime={post.publishedAt}>
                      {new Intl.DateTimeFormat('he-IL', { dateStyle: 'long' }).format(
                        new Date(post.publishedAt),
                      )}
                    </time>
                  </p>
                ) : null}

                <Heading level={3}>
                  <Link
                    to={postPath(post)}
                    className="underline-offset-4 hover:text-brand-700 hover:underline"
                  >
                    {post.title}
                  </Link>
                </Heading>

                {hasRealExcerpt(post) ? (
                  <Prose className="mt-2">
                    <p>{post.excerpt}</p>
                  </Prose>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="archive-cta-title" tone="dark" spacing="sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <Heading level={2} id="archive-cta-title" tone="dark">
            שאלה על נכס, פרויקט או השקעה?
          </Heading>
          <Button to="/contact" variant="onDark" size="lg" className="shrink-0">
            דברו איתנו
          </Button>
        </div>
      </Section>
    </>
  );
}
