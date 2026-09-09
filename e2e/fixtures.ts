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

export const test = base.extend({
  // Playwright names this second argument `use`; renamed here because eslint's
  // react-hooks rule reads any call to `use()` as the React hook.
  page: async ({ page }, runTest) => {
    await stubWebFonts(page);
    await runTest(page);
  },
});

export { expect } from '@playwright/test';
