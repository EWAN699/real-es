import { expect, test, waitForHydration } from './fixtures';

import { expectNoAxeViolations } from './axe';

/**
 * The suite runs under three projects — 375, 768 and 1440 — so every assertion
 * here is made at all three widths.
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('serves an RTL Hebrew document', async ({ page }) => {
  const html = page.locator('html');
  await expect(html).toHaveAttribute('dir', 'rtl');
  await expect(html).toHaveAttribute('lang', 'he');
});

test('states the service promise as real text in the h1', async ({ page }) => {
  const h1 = page.getByRole('heading', { level: 1 });

  await expect(h1).toHaveCount(1);
  await expect(h1).toContainText('100% שירות · 0% עמלות');

  // The promise must be selectable text, not pixels in a hero image.
  await expect(h1.locator('img, svg')).toHaveCount(0);
});

test('ships the promise in the prerendered HTML, before any script runs', async ({ request }) => {
  // Fetched without a browser: this is what a crawler receives.
  const response = await request.get('/');
  const html = await response.text();

  expect(html).toContain('100% שירות · 0% עמלות');
  expect(html).toMatch(/<h1[^>]*>[\s\S]*100% שירות/);
});

test('never scrolls horizontally', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

  expect(overflow).toBeLessThanOrEqual(1);
});

test('lays out from the right', async ({ page }) => {
  const heading = page.getByRole('heading', { level: 1 });
  const box = await heading.boundingBox();
  const viewport = page.viewportSize();

  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();

  // In RTL the text block starts at the right edge, so its right edge sits
  // close to the viewport's rather than being centred or left-aligned.
  if (box && viewport) {
    const distanceFromRight = viewport.width - (box.x + box.width);
    expect(distanceFromRight).toBeLessThan(viewport.width / 2);
  }
});

test('reserves space for every image, so nothing shifts as they load', async ({ page }) => {
  const frames = page.locator('[data-media-slug]');
  const count = await frames.count();

  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    const box = await frames.nth(index).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThan(0);
  }
});

test('loads no third-party script or iframe on first paint', async ({ page }) => {
  // The legacy homepage carried a Facebook page embed, a ten-language
  // translation widget, an accessibility overlay and reCAPTCHA.
  const external = await page.evaluate(() => {
    const origin = window.location.origin;
    const scripts = Array.from(document.querySelectorAll('script[src]'))
      .map((element) => (element as HTMLScriptElement).src)
      .filter((src) => !src.startsWith(origin));

    return { scripts, iframes: document.querySelectorAll('iframe').length };
  });

  expect(external.scripts).toEqual([]);
  expect(external.iframes).toBe(0);
});

test('publishes the organisation as structured data, and invents no rating', async ({
  request,
}) => {
  const html = await (await request.get('/')).text();

  const match = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  expect(match, 'no JSON-LD block in the prerendered homepage').not.toBeNull();

  const node = JSON.parse(match?.[1] ?? '{}') as Record<string, unknown>;
  expect(node['@type']).toContain('RealEstateAgent');

  // The legacy counters put a "69" next to a testimonial stating 9.6. Neither
  // is a verified rating, so no rating is claimed at all.
  expect(html).not.toContain('aggregateRating');
});

test('has no axe violations', async ({ page }) => {
  await expectNoAxeViolations(page, 'home');
});

test('has no axe violations with the mobile menu open', async ({ page }) => {
  const toggle = page.getByRole('button', { name: 'תפריט', exact: true });
  if (!(await toggle.isVisible())) test.skip();

  // The panel is mounted by the client, so it cannot open before hydration.
  await waitForHydration(page);

  await toggle.click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await expectNoAxeViolations(page, 'home, menu open');
});
