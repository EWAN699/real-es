import { Link } from 'react-router-dom';

import { cn } from '@/components/ui/cn';

/**
 * The wordmark: an inlined brand mark plus live text.
 *
 * The mark is a Roman arch with its keystone (`public/logo-mark.svg`, and the
 * tiled variant in `public/favicon.svg`). It is inlined rather than loaded as an
 * `<img>` so it costs no request on first paint, stays sharp at any density, and
 * takes its colours from the design tokens instead of from hex values baked into
 * a file — the keystone has to flip on a dark ground, and an `<img>` could not.
 *
 * The arch is an opening, not a dome: `fill-rule="evenodd"` cuts the void
 * between the piers, which is what makes it read as architecture. Do not
 * flatten it into a single path.
 *
 * The words stay text. A logo image would need alt text repeating them, and the
 * `CAESAR` line and Hebrew name are what a search engine and a screen reader
 * actually use. The mark is `aria-hidden` so it is not announced twice: the
 * link's accessible name comes from the text beside it.
 */
export function Logo({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-3"
      aria-label="קבוצת קיסר — לדף הבית"
    >
      <CaesarMark tone={tone} />

      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display text-h3 font-black',
            tone === 'dark' ? 'text-stone-50' : 'text-ink-900',
          )}
        >
          קבוצת קיסר
        </span>
        <span
          className={cn(
            'text-small font-semibold tracking-[0.2em]',
            tone === 'dark' ? 'text-brand-300' : 'text-brand-700',
          )}
          dir="ltr"
        >
          CAESAR
        </span>
      </span>
    </Link>
  );
}

function CaesarMark({ tone }: { tone: 'light' | 'dark' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className="size-10 shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      {/* brand-500 as a filled shape, which is the one thing the logo green is
          for. It is never a text colour on a light ground. */}
      <path
        className="fill-brand-500"
        fillRule="evenodd"
        d="M16 50 L16 28 A16 16 0 0 1 48 28 L48 50 Z
           M24 50 L24 28 A8 8 0 0 1 40 28 L40 50 Z"
      />
      {/* The keystone flips with the ground it sits on, so it stays visible in
          the footer as well as the header. */}
      <path
        className={tone === 'dark' ? 'fill-stone-100' : 'fill-ink-900'}
        d="M28.1 21 L26.5 13 L37.5 13 L35.9 21 Z"
      />
    </svg>
  );
}
