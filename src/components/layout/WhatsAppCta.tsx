import { whatsappHref } from '@/content/contact';

/**
 * The persistent WhatsApp affordance.
 *
 * A plain anchor to `wa.me` — no widget script, no third-party bundle on first
 * paint. It sits last in the DOM so it does not intercept the tab order on the
 * way into the page, and `brand-500` is used here as a fill behind `ink-900`
 * text (8.7:1), which is the one place the logo green is allowed to carry a
 * control.
 */
export function WhatsAppCta() {
  return (
    <a
      href={whatsappHref('שלום, הגעתי מהאתר ואשמח לפרטים.')}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 end-5 z-30 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-3 font-semibold text-ink-900 shadow-lg transition-colors duration-200 hover:bg-brand-300 print:hidden"
    >
      <WhatsAppIcon />
      {/*
       * One label, not two. A narrow viewport shows the icon alone, but the
       * text stays in the accessibility tree rather than being swapped for a
       * second `sr-only` copy — two copies read the name twice wherever the
       * breakpoint does not apply, which is exactly where a screen reader is.
       */}
      <span className="sr-only sm:not-sr-only">דברו איתנו בוואטסאפ</span>
      <span className="sr-only">(נפתח בחלון חדש)</span>
    </a>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.19-.53.06-.25-.12-1.05-.38-1.99-1.23-.74-.65-1.23-1.46-1.38-1.71-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.44.06-.66.31-.23.25-.87.85-.87 2.07s.89 2.4 1.02 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}
