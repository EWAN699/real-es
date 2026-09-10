/**
 * Full-page screenshots of every route in content/pages.json, at each viewport
 * and in each motion mode.
 *
 * Output: screenshots/{project}/{slug}.png — gitignored, uploaded by CI.
 *
 * These are artefacts for review, not visual-regression assertions: there is
 * no committed baseline yet, and there should not be one until the design has
 * settled. What IS asserted is the reduced-motion contract — nothing on the
 * page may be left invisible when animation is off.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

interface Content {
  pages: Array<{ slug: string; title: string; sections: Array<{ id: string }> }>;
}

const content = JSON.parse(
  readFileSync(path.join(process.cwd(), 'content/pages.json'), 'utf8'),
) as Content;

function fileNameFor(slug: string): string {
  return slug === '/' ? 'home' : slug.replace(/^\//, '').replace(/\//g, '__');
}

/** Let webfonts land and any entry animation settle before capturing. */
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(600);
}

for (const p of content.pages) {
  test(`screenshot ${p.slug}`, async ({ page }, testInfo) => {
    const response = await page.goto(p.slug, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), `${p.slug} should render`).toBeLessThan(400);

    // The document must be RTL Hebrew regardless of route.
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'he');

    // Scroll the whole page so scroll-triggered content has been triggered
    // before we capture it.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await settle(page);

    await page.screenshot({
      path: path.join('screenshots', testInfo.project.name, `${fileNameFor(p.slug)}.png`),
      fullPage: true,
    });
  });
}

test('reduced motion leaves nothing invisible', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.endsWith('-reduced-motion'), 'reduced-motion projects only');

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await settle(page);

  // Every section root must be in static mode, and no heading may be
  // transparent or translated away. contracts/motion.spec.md rule 1.
  const sections = page.locator('[data-motion]');
  const count = await sections.count();
  expect(count, 'the home page should render at least one motion-managed section').toBeGreaterThan(
    0,
  );

  for (let i = 0; i < count; i += 1) {
    const section = sections.nth(i);
    await expect(section).toHaveAttribute('data-motion-mode', 'static');
  }

  const invisible = await page.evaluate(() => {
    const bad: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('h1, h2, h3, p, li, [data-animate]')) {
      const cs = getComputedStyle(el);
      if (!el.textContent?.trim()) continue;
      if (Number(cs.opacity) < 0.99 || cs.visibility === 'hidden') {
        bad.push(
          `${el.tagName.toLowerCase()}.${el.className} opacity=${cs.opacity} vis=${cs.visibility}`,
        );
      }
    }
    return bad;
  });
  expect(invisible, 'nothing should be hidden when motion is off').toEqual([]);
});

/**
 * API checks run in ONE project only. They are not viewport-dependent, and the
 * contact route's rate limiter (5/min/IP) would otherwise be tripped by six
 * projects hitting it from the same address.
 */
const API_PROJECT = 'desktop-1440';

test('the OG image route renders', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== API_PROJECT, `runs in ${API_PROJECT} only`);
  const res = await request.get('/api/og?slug=/');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
  expect((await res.body()).byteLength).toBeGreaterThan(5_000);
});

test('the contact endpoint validates', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== API_PROJECT, `runs in ${API_PROJECT} only`);
  const bad = await request.post('/api/contact', {
    data: { name: 'x', email: 'nope', message: '' },
  });
  expect(bad.status()).toBe(422);

  const ok = await request.post('/api/contact', {
    data: {
      name: 'ישראל ישראלי',
      email: 'test@example.com',
      message: 'הודעת בדיקה אוטומטית מתוך Playwright.',
      pageSlug: '/צור-קשר',
    },
  });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toMatchObject({ ok: true });
});
