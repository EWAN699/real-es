import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Heading } from '@/components/ui/Heading';
import { primaryNav } from '@/components/layout/nav';
import { Prose } from '@/components/ui/Prose';
import { Section } from '@/components/ui/Section';
import { Link } from 'react-router-dom';

/**
 * 404.
 *
 * A decade of WordPress URLs is being retired, so this page will be reached —
 * `src/lib/redirects.ts` catches the ones we know about, and this catches the
 * rest. It offers the five real destinations rather than a dead end, and is
 * `noindex` so a mis-linked URL cannot compete in search with the page it was
 * meant to be.
 */
export function Component() {
  return (
    <>
      <Seo
        title="הדף לא נמצא"
        description="הדף שחיפשתם אינו קיים. אלה הדפים המרכזיים באתר קבוצת קיסר."
        noIndex
      />

      <Section labelledBy="notfound-title" spacing="lg" width="narrow">
        <p className="tabular text-small font-semibold tracking-[0.2em] text-brand-700">404</p>

        <Heading level={1} id="notfound-title" className="mt-4">
          הדף שחיפשתם לא נמצא
        </Heading>

        <Prose className="mt-6">
          <p>
            ייתכן שהכתובת השתנתה. אפשר להתחיל מדף הבית, או לגשת ישירות לאחד מתחומי הפעילות.
          </p>
        </Prose>

        <div className="mt-8">
          <Button to="/" size="lg">
            חזרה לדף הבית
          </Button>
        </div>

        <nav aria-label="דפים מרכזיים" className="mt-10 border-t border-stone-200 pt-8">
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {primaryNav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="font-semibold text-brand-700 underline underline-offset-4 hover:text-ink-900"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Section>
    </>
  );
}

Component.displayName = 'NotFound';
