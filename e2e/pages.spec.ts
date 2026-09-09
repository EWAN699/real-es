import { expect, test } from './fixtures';

import { expectNoAxeViolations } from './axe';

/**
 * Every page the rebuild adds, checked for the things that must be true of all
 * of them: one `h1` that names the page, no horizontal scroll at any of the
 * three widths, the heading present in the prerendered HTML before a single
 * script runs, and a clean axe pass.
 *
 * The whole suite runs under the 375 / 768 / 1440 projects, so each case here is
 * really three.
 *
 * The Hebrew slugs are percent-encoded deliberately: these are the URLs the
 * legacy WordPress permalinks redirect to, and they have to work as typed.
 */
const pages = [
  { path: '/management', heading: 'ניהול נכסים' },
  { path: '/construction', heading: 'בנייה ויזמות' },
  { path: '/investment', heading: 'עסקים והשקעות' },
  { path: '/services/property-management', heading: 'ניהול נכסים' },
  { path: '/services/tama-38', heading: 'תמ"א 38' },
  { path: '/listings', heading: 'נכסים' },
  { path: '/listings/netanya-seafront-plot', heading: 'מגרש בקו ראשון לים בנתניה' },
  { path: '/about', heading: 'קבוצת קיסר' },
  { path: '/testimonials', heading: 'לקוחות ממליצים' },
  { path: '/testimonials/haker-meir', heading: 'הקר מאיר' },
  { path: '/blog', heading: 'הבלוג של קיסר' },
  { path: `/blog/${encodeURIComponent('מוכר-דירה')}`, heading: 'מוכר דירה' },
  { path: '/news', heading: 'חדשות קיסר' },
  { path: '/contact', heading: 'דברו איתנו' },
  { path: '/accessibility', heading: 'הצהרת נגישות' },
  { path: '/privacy', heading: 'מדיניות פרטיות' },
] as const;

for (const page_ of pages) {
  test.describe(page_.path, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(page_.path);
    });

    test('has exactly one h1, and it names the page', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 });

      await expect(h1).toHaveCount(1);
      await expect(h1).toContainText(page_.heading);
      // The heading is text, never pixels in an image.
      await expect(h1.locator('img, svg')).toHaveCount(0);
    });

    test('serves the heading in the prerendered HTML', async ({ request }) => {
      // Fetched without a browser: this is what a crawler receives.
      const response = await request.get(page_.path);
      expect(response.status()).toBe(200);

      const html = await response.text();
      expect(html).toMatch(/<h1[^>]*>/);
      expect(html).toContain(page_.heading);
    });

    test('never scrolls horizontally', async ({ page }) => {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );

      expect(overflow).toBeLessThanOrEqual(1);
    });

    test('loads no third-party script or iframe', async ({ page }) => {
      const external = await page.evaluate(() => {
        const origin = window.location.origin;
        return {
          scripts: Array.from(document.querySelectorAll('script[src]'))
            .map((element) => (element as HTMLScriptElement).src)
            .filter((src) => !src.startsWith(origin)),
          iframes: document.querySelectorAll('iframe').length,
        };
      });

      expect(external.scripts).toEqual([]);
      expect(external.iframes).toBe(0);
    });

    test('has no axe violations', async ({ page }) => {
      await expectNoAxeViolations(page, page_.path);
    });
  });
}

test('the footer legal links reach the two pages the law requires', async ({ page }) => {
  await page.goto('/');

  const footer = page.getByRole('contentinfo');

  await footer.getByRole('link', { name: 'הצהרת נגישות' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('הצהרת נגישות');
  // The Israeli standard and the WCAG level have to be stated, not implied.
  await expect(page.getByText('5568')).toBeVisible();
  await expect(page.getByText(/WCAG 2\.1/)).toBeVisible();

  await page.getByRole('contentinfo').getByRole('link', { name: 'מדיניות פרטיות' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('מדיניות פרטיות');
});

test('the primary navigation now reaches real pages rather than the 404', async ({ page }) => {
  await page.goto('/');

  for (const path of ['/management', '/construction', '/investment', '/listings', '/about']) {
    const response = await page.goto(path);

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).not.toContainText('לא נמצא');
  }
});
