import { expect, test } from '@playwright/test';

import { expectNoAxeViolations } from './axe';

const PRIMARY = ['ניהול נכסים', 'בנייה ויזמות', 'עסקים והשקעות', 'נכסים', 'הקבוצה'];

/**
 * The information architecture, asserted.
 *
 * The legacy site carried around thirty-five items over four levels of dropdown.
 * The rebuild's whole navigation claim is that five destinations plus two
 * editorial ones is enough — so the count is a test, not a convention.
 */
test('offers five primary destinations and no submenus', async ({ page }) => {
  await page.goto('/');

  const desktopNav = page.getByRole('navigation', { name: 'ניווט ראשי' });

  if (await desktopNav.isVisible()) {
    await expect(desktopNav.getByRole('link')).toHaveCount(PRIMARY.length);
    for (const label of PRIMARY) {
      await expect(desktopNav.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
  } else {
    await page.getByRole('button', { name: 'תפריט', exact: true }).click();
    const menu = page.getByRole('navigation', { name: 'ניווט ראשי בנייד' });
    await expect(menu.getByRole('link')).toHaveCount(PRIMARY.length + 2);
  }

  // No hover-revealed second level anywhere in the header.
  await expect(page.locator('header [role="menu"], header ul ul ul')).toHaveCount(0);
});

test('the persistent WhatsApp CTA is a plain link, present on every page', async ({ page }) => {
  for (const path of ['/', '/a-page-that-never-existed']) {
    await page.goto(path);

    const cta = page.getByRole('link', { name: /דברו איתנו בוואטסאפ/ });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', /^https:\/\/wa\.me\/\d+/);
  }
});

test('the footer publishes reachable contact details', async ({ page }) => {
  await page.goto('/');

  const footer = page.getByRole('contentinfo');
  await expect(footer.locator('a[href^="tel:"]').first()).toBeVisible();
  await expect(footer.locator('a[href^="mailto:"]').first()).toBeVisible();
});

test('an unknown URL lands on a 404 that offers the way onward', async ({ page }) => {
  await page.goto('/services/%D7%A0%D7%99%D7%94%D7%95%D7%9C-%D7%A0%D7%9B%D7%A1%D7%99%D7%9D');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('לא נמצא');
  await expect(page.getByRole('navigation', { name: 'דפים מרכזיים' })).toBeVisible();

  await expectNoAxeViolations(page, 'legacy url 404');
});
