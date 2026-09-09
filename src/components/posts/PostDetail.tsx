import { useParams } from 'react-router-dom';

import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Heading } from '@/components/ui/Heading';
import { MediaImage } from '@/components/ui/MediaImage';
import { Prose } from '@/components/ui/Prose';
import { Section } from '@/components/ui/Section';
import { getPost, hasRealDate, hasRealExcerpt, postPath } from '@/content/posts';
import type { Post } from '@/content/types';
import { Component as NotFound } from '@/pages/NotFound';

/**
 * A single blog or news post.
 *
 * These pages exist because the redirect map sends a hundred and one legacy
 * URLs here, and a redirect that lands on a 404 is worse than no redirect. What
 * they cannot do yet is show the article: only the client's homepage could be
 * read, so the content layer holds each post's title and permalink and nothing
 * else — no body, no date, no teaser.
 *
 * So the page says that, in one sentence, and offers the archive and the phone
 * number. It does not:
 *
 *  - print `PENDING_DATE` (gated behind `hasRealDate`),
 *  - print the title a second time as a teaser (gated behind `hasRealExcerpt`),
 *  - or generate a body. Writing an article under someone else's byline is not
 *    a rendering decision.
 *
 * It is `noindex`. The redirect keeps the old URL working for a person who
 * follows a ten-year-old link; offering a hundred headline-only pages to a
 * search engine is how a site acquires a doorway-page problem. When the client's
 * export lands and the `Post` schema carries a body, this page renders it and
 * the `noIndex` gives way to a canonical `path` — that is the only change
 * needed here.
 */
export function PostDetail({ kind }: { kind: Post['kind'] }) {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPost(kind, slug) : undefined;

  if (!post) return <NotFound />;

  const archivePath = kind === 'blog' ? '/blog' : '/news';
  const archiveLabel = kind === 'blog' ? 'הבלוג של קיסר' : 'חדשות קיסר';

  return (
    <>
      <Seo
        title={post.title}
        description={hasRealExcerpt(post) ? post.excerpt : `${archiveLabel} — ${post.title}`}
        noIndex
      />

      <PageHeader
        eyebrow={archiveLabel}
        title={post.title}
        crumbs={[
          { label: 'דף הבית', to: '/' },
          { label: archiveLabel, to: archivePath },
          { label: post.title, to: postPath(post) },
        ]}
      >
        {hasRealDate(post) ? (
          <p className="text-small text-ink-600">
            <time dateTime={post.publishedAt}>
              {new Intl.DateTimeFormat('he-IL', { dateStyle: 'long' }).format(
                new Date(post.publishedAt),
              )}
            </time>
          </p>
        ) : null}
      </PageHeader>

      <Section labelledBy="post-body-title" tone="default" width="narrow">
        <Heading level={2} id="post-body-title">
          על הכתבה
        </Heading>

        {post.image ? (
          <MediaImage
            slug={post.image}
            aspect="16:9"
            sizes="(min-width: 768px) 60vw, 100vw"
            className="mt-6 w-full"
          />
        ) : null}

        {hasRealExcerpt(post) ? (
          <Prose className="mt-6">
            <p>{post.excerpt}</p>
          </Prose>
        ) : null}

        <Prose className="mt-6">
          <p>
            הכתבה הזו פורסמה באתר הקודם של קבוצת קיסר, והתוכן המלא שלה עדיין בהעברה. הכתובת נשמרה
            כדי שקישורים ותיים ימשיכו לעבוד.
          </p>
          <p>
            בינתיים אפשר לעבור ל{archiveLabel}, או לשאול אותנו ישירות — נשמח לענות.
          </p>
        </Prose>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button to={archivePath} variant="secondary">
            לכל הפרסומים
          </Button>
          <Button to="/contact">שאלו אותנו</Button>
        </div>
      </Section>
    </>
  );
}
