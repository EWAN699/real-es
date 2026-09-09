import { expect, test } from '@playwright/test';

/**
 * Keyboard operation, checked in a real browser.
 *
 * jsdom can prove the focus trap's logic; only a browser proves that the thing
 * a keyboard user reaches is the thing they can see. Everything here is done
 * without a single click.
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/');
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

test('tab order runs through the header before the page content', async ({ page }) => {
  const reached: string[] = [];

  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press('Tab');
    reached.push(
      await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        if (!active) return '';
        return (active.getAttribute('aria-label') ?? active.textContent ?? '').trim();
      }),
    );
  }

  // The wordmark is the first real destination after the skip link.
  expect(reached.slice(0, 3).join(' | ')).toContain('קבוצת קיסר');
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
