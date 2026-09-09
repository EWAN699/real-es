import { Link } from 'react-router-dom';

import { cn } from '@/components/ui/cn';

/**
 * The wordmark is set as live text, not an image.
 *
 * A logo image would need alt text saying the same words, cost a request on
 * first paint, and blur on a high-density screen. `brand-500` appears here only
 * as a filled shape, never as a text colour.
 */
export function Logo({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-3"
      aria-label="קבוצת קיסר — לדף הבית"
    >
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-500 font-display text-h3 font-black text-ink-900"
      >
        ק
      </span>

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
