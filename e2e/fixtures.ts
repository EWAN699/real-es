import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * The shared `test`, with the web fonts stubbed out.
 *
 * The suite runs against the prerendered build, and that build asks Google for
 * Heebo and Assistant. Letting it is a mistake in a test: every navigation then
 * waits on a third party, so the suite is slow when the network is good, and
 * red when it is not — a failure that says nothing about the code. Blocking the
 * request makes each run hermetic and deterministic.
 *
 * Nothing asserted here depends on which font renders. The one thing that would
 * — that the page loads no third-party script or iframe on first paint — is a
 * separate check on the document, not on the network.
 */
async function stubWebFonts(page: Page) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
}

/**
 * Wait until the client has taken over the prerendered markup.
 *
 * Every page arrives as static HTML, so a control can be on screen and visible
 * a moment before React has attached its handlers. A click in that window is
 * genuinely lost — the filter does not filter, the form does the browser's own
 * GET submit — and in a parallel run it is lost often enough to make any test
 * that drives a control flaky for a reason that has nothing to do with the code
 * under test. `RootLayout` stamps `data-hydrated` in its first effect.
 *
 * Only for tests that interact. Tests about what the page *shows* must not wait
 * for script: that is the point of prerendering it.
 */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
}

export const test = base.extend({
  // Playwright names this second argument `use`; renamed here because eslint's
  // react-hooks rule reads any call to `use()` as the React hook.
  page: async ({ page }, runTest) => {
    await stubWebFonts(page);
    await runTest(page);
  },
});

export { expect } from '@playwright/test';
