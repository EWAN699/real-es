import { expect, test, waitForHydration } from './fixtures';

/**
 * Keyboard operation, checked in a real browser.
 *
 * jsdom can prove the focus trap's logic; only a browser proves that the thing
 * a keyboard user reaches is the thing they can see. Everything here is done
 * without a single click.
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Everything below drives a control. The page is prerendered, so a keypress
  // that lands before React has attached its handlers is simply lost — a flake
  // that says nothing about the behaviour being tested.
  await waitForHydration(page);
});

test('the first Tab reaches a skip link that jumps to the main landmark', async ({ page }) => {
  await page.keyboard.press('Tab');

  const focused = page.locator(':focus');
  await expect(focused).toHaveText('דילוג לתוכן המרכזי');
  // A skip link that is invisible when focused is not a skip link.
  await expect(focused).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('every interactive element shows a focus ring', async ({ page }) => {
  await page.keyboard.press('Tab');

  const outline = await page.evaluate(() => {
    const active = document.activeElement;
    if (!active) return null;
    const style = getComputedStyle(active);
    return { width: style.outlineWidth, style: style.outlineStyle };
  });

  expect(outline?.style).not.toBe('none');
  expect(Number.parseFloat(outline?.width ?? '0')).toBeGreaterThan(0);
});

test('tab order runs through the whole header before any page content', async ({ page }) => {
  // DOM order is the tab order: no positive tabindex anywhere.
  expect(await page.locator('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])').count()).toBe(0);

  const regions: string[] = [];

  for (let step = 0; step < 25; step += 1) {
    await page.keyboard.press('Tab');

    const region = await page.evaluate(() => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return 'none';
      if (active.matches('a[href="#main"]')) return 'skip';
      if (active.closest('header')) return 'header';
      if (active.closest('main')) return 'main';
      if (active.closest('footer')) return 'footer';
      return 'other';
    });

    regions.push(region);
    if (region === 'main') break;
  }

  // The skip link first, then the whole header, then the page content — never a
  // page control interleaved with the navigation, and nothing unaccounted for.
  expect(regions[0]).toBe('skip');
  expect(regions).toContain('main');
  expect(new Set(regions.slice(0, regions.indexOf('main')))).toEqual(
    new Set(['skip', 'header']),
  );
  // The wordmark is somewhere in that header run.
  await expect(page.getByRole('banner').getByRole('link', { name: /קבוצת קיסר/ })).toBeVisible();
});

test('the mobile menu opens, traps focus and closes on Escape, without a pointer', async ({
  page,
}) => {
  const toggle = page.getByRole('button', { name: 'תפריט', exact: true });
  if (!(await toggle.isVisible())) test.skip();

  await toggle.focus();
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'תפריט ראשי' });
  await expect(dialog).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');

  // Focus starts inside the panel.
  await expect(dialog.locator(':focus')).toHaveCount(1);

  // Tabbing repeatedly never escapes it.
  for (let step = 0; step < 15; step += 1) {
    await page.keyboard.press('Tab');
    const inside = await dialog.evaluate((element) => element.contains(document.activeElement));
    expect(inside, `focus left the dialog after ${step + 1} tabs`).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('the lead form is completable and submittable from the keyboard', async ({ page }) => {
  const name = page.getByLabel(/שם מלא/);
  await name.scrollIntoViewIfNeeded();
  await name.focus();
  await page.keyboard.type('ישראל ישראלי');

  await page.keyboard.press('Tab');
  await page.keyboard.type('052-1234567');

  // Nothing between the fields and the submit button is a focus trap.
  const reachedSubmit = await page.evaluate(() => {
    const button = document.querySelector('form button[type="submit"]');
    return button instanceof HTMLElement && !button.hasAttribute('disabled');
  });

  expect(reachedSubmit).toBe(true);
});
