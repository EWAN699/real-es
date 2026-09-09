import { Link } from 'react-router-dom';

import { Container } from '@/components/ui/Container';

import { contact, telHref, whatsappHref } from '@/content/contact';
import { Logo } from './Logo';
import { divisionNav, editorialNav, legalNav, primaryNav } from './nav';

/**
 * Footer. Contact details are marked up as real links — `tel:`, `mailto:` and
 * `wa.me` — so a phone can act on them.
 *
 * On the ink-900 ground the brand colour flips to `brand-300`: `brand-700` is
 * the light-ground token and would fail contrast here just as `brand-500`
 * failed on white.
 */
export function Footer() {
  const year = new Date().getFullYear();
  const companyLinks = primaryNav.filter(
    (item) => !divisionNav.some((division) => division.to === item.to),
  );

  return (
    <footer className="bg-ink-900 text-stone-200">
      <Container className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <Logo tone="dark" />
          <p className="max-w-xs text-small text-stone-200">
            קבוצת קיסר מלווה בעלי נכסים, יזמים ומשקיעים — מניהול שוטף ועד ליווי פרויקטים
            והשקעות בנדל״ן מניב.
          </p>
        </div>

        <nav aria-labelledby="footer-divisions">
          <h2 id="footer-divisions" className="text-h3 font-bold text-stone-50">
            תחומי הפעילות
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {divisionNav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-small text-stone-200 underline-offset-4 hover:text-brand-300 hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-company">
          <h2 id="footer-company" className="text-h3 font-bold text-stone-50">
            הקבוצה
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {[...companyLinks, ...editorialNav].map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-small text-stone-200 underline-offset-4 hover:text-brand-300 hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-h3 font-bold text-stone-50">יצירת קשר</h2>
          <address className="mt-4 flex flex-col gap-2 text-small not-italic">
            <a
              href={telHref(contact.nationalPhone)}
              className="text-stone-200 underline-offset-4 hover:text-brand-300 hover:underline"
            >
              <span className="text-stone-200">מוקד ארצי: </span>
              <span className="tabular" dir="ltr">
                {contact.nationalPhone}
              </span>
            </a>
            <a
              href={telHref(contact.directPhone)}
              className="text-stone-200 underline-offset-4 hover:text-brand-300 hover:underline"
            >
              <span className="text-stone-200">משרד: </span>
              <span className="tabular" dir="ltr">
                {contact.directPhone}
              </span>
            </a>
            <a
              href={`mailto:${contact.email}`}
              className="text-stone-200 underline-offset-4 hover:text-brand-300 hover:underline"
            >
              <span dir="ltr">{contact.email}</span>
            </a>
            <a
              href={whatsappHref()}
              className="text-stone-200 underline-offset-4 hover:text-brand-300 hover:underline"
            >
              וואטסאפ
            </a>
            <span>{contact.addressLocality}</span>
          </address>
        </div>
      </Container>

      <div className="border-t border-stone-200/15">
        <Container className="flex flex-col gap-4 py-6 text-small sm:flex-row sm:items-center sm:justify-between">
          <p className="text-stone-200">© {year} קבוצת קיסר. כל הזכויות שמורות.</p>

          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalNav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-stone-200 underline underline-offset-4 hover:text-brand-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </footer>
  );
}
