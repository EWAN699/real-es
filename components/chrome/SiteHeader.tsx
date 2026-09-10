/**
 * Fixed site header.
 *
 * The site is a single scroll page, so the nav is in-page anchors rather than
 * routes. It sits over the hero's dark video, so it is styled for the dark
 * ground and does not change on scroll — a header that restyles itself midway
 * needs a scroll listener running the whole time, and this page already spends
 * its frame budget on pinned sections.
 *
 * The national phone number is the primary conversion and stays visible at
 * every width; the anchor list collapses away on small screens, where scrolling
 * is the natural way through a one-page site anyway.
 */
import { site } from '@/lib/content';

const NAV = [
  { href: '#about', label: 'אודות' },
  { href: '#services', label: 'תחומי ניהול' },
  { href: '#method', label: 'השיטה' },
  { href: '#coverage', label: 'אזורי שירות' },
  { href: '#faq', label: 'שאלות' },
  { href: '#contact', label: 'צור קשר' },
];

export function SiteHeader() {
  const phone = site.contact?.phones?.[0];

  return (
    <header className="absolute inset-x-0 top-0 z-50 text-limestone">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-6">
        <a href="#main" className="text-lg font-bold tracking-tight">
          {site.name}
        </a>

        <nav aria-label="ניווט ראשי" className="hidden lg:block">
          <ul className="flex items-center gap-7 text-sm">
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="transition-colors hover:text-brass-lift">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {phone ? (
          <a
            href={`tel:${phone.replace(/[^\d+]/g, '')}`}
            className="numeral rounded-full border border-limestone/30 px-4 py-2 text-sm font-semibold transition-colors hover:border-brass hover:text-brass-lift"
          >
            {phone}
          </a>
        ) : null}
      </div>
    </header>
  );
}
