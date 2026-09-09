import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useInertBackground } from '@/hooks/useInertBackground';
import { useMediaQuery } from '@/hooks/useMediaQuery';

import { contact, telHref } from '@/content/contact';
import { editorialNav, primaryNav } from './nav';

/**
 * The mobile navigation panel.
 *
 * Mounted only while open, so there is never a screenful of off-canvas links
 * sitting in the tab order or the accessibility tree behind the page. It is a
 * modal dialog and behaves like one: focus moves in on open, is trapped while
 * open, Escape closes it, and focus returns to the toggle that opened it.
 *
 * It also closes on navigation and when the viewport grows past the breakpoint
 * where the desktop nav takes over — otherwise a rotated phone leaves an
 * invisible modal holding the keyboard hostage.
 *
 * The page behind it is made `inert` for as long as it is open. The focus trap
 * holds the Tab key, but a screen reader's virtual cursor ignores Tab entirely,
 * so without `inert` the whole site is still readable — and clickable — behind
 * a panel the user cannot see.
 */
export type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  /** Id the toggle button points at with `aria-controls`. */
  id: string;
};

export function MobileMenu({ open, onClose, id }: MobileMenuProps) {
  const panelRef = useFocusTrap<HTMLDivElement>(open);
  const overlayRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  useBodyScrollLock(open);
  // The overlay, not the panel: the scrim is inside it and stays clickable.
  useInertBackground(open, overlayRef);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Navigating away must not leave the panel open over the new page.
  useEffect(() => {
    if (open) onClose();
    // Deliberately keyed on the location only: this is "the route changed",
    // not "the open state changed".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (open && isDesktop) onClose();
  }, [open, isDesktop, onClose]);

  if (!open) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 lg:hidden">
      {/*
       * The scrim is a pointer convenience, not a control: it duplicates the
       * close button in the panel, so it is taken out of the accessibility tree
       * and the tab order rather than announced twice under the same name.
       */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 h-full w-full cursor-default bg-ink-900/60"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label="תפריט ראשי"
        tabIndex={-1}
        className="absolute inset-y-0 end-0 flex w-full max-w-sm flex-col overflow-y-auto bg-stone-50 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <p className="font-display text-h3 font-bold text-ink-900">תפריט</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-ink-900 transition-colors duration-200 hover:text-brand-700"
          >
            <span className="sr-only">סגירת התפריט</span>
            <CloseIcon />
          </button>
        </div>

        <nav aria-label="ניווט ראשי בנייד" className="flex-1 px-5 py-6">
          <ul className="flex flex-col gap-1">
            {primaryNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-md px-3 py-3 text-h3 font-bold transition-colors duration-200',
                      isActive ? 'bg-stone-100 text-brand-700' : 'text-ink-900 hover:text-brand-700',
                    )
                  }
                >
                  {item.label}
                  {item.description ? (
                    <span className="mt-0.5 block text-small font-normal text-ink-600">
                      {item.description}
                    </span>
                  ) : null}
                </NavLink>
              </li>
            ))}
          </ul>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-stone-200 pt-6">
            {editorialNav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'text-body font-semibold underline-offset-4 hover:underline',
                      isActive ? 'text-brand-700' : 'text-ink-600',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-3 border-t border-stone-200 px-5 py-6">
          <Button to="/contact" size="lg" fullWidth>
            דברו איתנו
          </Button>
          <a
            href={telHref(contact.nationalPhone)}
            className="text-center text-body font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            {contact.nationalPhone}
          </a>
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true" focusable="false">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
