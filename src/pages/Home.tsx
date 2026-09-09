/**
 * Placeholder home page — replaced by the `caesar-ui` agent in Phase 1.
 *
 * It exists to prove the prerender pipeline, the RTL shell and the token layer
 * before parallel work begins. The headline is the one piece of real content
 * here on purpose: on the legacy site the group's differentiator lived inside a
 * carousel JPEG, invisible to search engines and screen readers. It is text now.
 */
export function Component() {
  return (
    <main className="container-page py-24">
      <p className="text-small font-semibold tracking-wide text-brand-700">קבוצת קיסר</p>

      <h1 className="mt-4 text-h1 text-ink-900 md:text-display">
        מנהלים לך את הנכס
        <br />
        באופן מושלם
      </h1>

      <p className="mt-6 max-w-prose text-body text-ink-600">
        ניהול נכסים, בנייה ויזמות, והשקעות — בפריסה ארצית.
      </p>

      <p className="tabular mt-10 text-h3 font-bold text-brand-700">100% שירות · 0% עמלות</p>
    </main>
  );
}

Component.displayName = 'Home';
