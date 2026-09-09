import { useState } from 'react';
import { NavLink } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';
import { Container } from '@/components/ui/Container';

import { contact, telHref } from '@/content/contact';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';
import { editorialNav, primaryNav } from './nav';

const MENU_ID = 'site-menu';

/**
 * Site header: wordmark, the five primary destinations, the two editorial ones,
 * and a phone number that is a real `tel:` link rather than an image of digits.
 *
 * `NavLink` sets `aria-current="page"` itself, so the active state is announced
 * and not only coloured.
 */
export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-stone-50">
      <div className="hidden border-b border-stone-200 bg-stone-100 lg:block">
        <Container className="flex items-center justify-between py-2 text-small">
          <p className="text-ink-600">ניהול נכסים · בנייה ויזמות · עסקים והשקעות</p>

          <div className="flex items-center gap-6">
            <ul className="flex items-center gap-6">
              {editorialNav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'font-semibold underline-offset-4 hover:underline',
                        isActive ? 'text-brand-700' : 'text-ink-600 hover:text-brand-700',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <a
              href={telHref(contact.nationalPhone)}
              className="font-semibold text-brand-700 underline-offset-4 hover:underline"
            >
              <span className="sr-only">טלפון: </span>
              {contact.nationalPhone}
            </a>
          </div>
        </Container>
      </div>

      <Container className="flex items-center justify-between gap-6 py-4">
        <Logo />

        <nav aria-label="ניווט ראשי" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {primaryNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-md px-3 py-2 text-body font-semibold transition-colors duration-200',
                      isActive ? 'text-brand-700' : 'text-ink-900 hover:text-brand-700',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Button to="/contact" size="sm" className="hidden lg:inline-flex">
            דברו איתנו
          </Button>

          <button
            type="button"
            aria-expanded={menuOpen}
            /* Only reference the panel while it exists — the menu is unmounted
             * when closed, and a dangling aria-controls target is an axe finding. */
            aria-controls={menuOpen ? MENU_ID : undefined}
            onClick={() => setMenuOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-small font-semibold text-ink-900 transition-colors duration-200 hover:border-brand-600 lg:hidden"
          >
            <MenuIcon />
            תפריט
          </button>
        </div>
      </Container>

      <MobileMenu id={MENU_ID} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" focusable="false">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
