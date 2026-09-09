import { expect, test, waitForHydration } from './fixtures';

/**
 * What the site does when the enhancements are not there.
 *
 * Reveal-on-scroll is decorative, so a page whose sections only become visible
 * once an IntersectionObserver fires is a page that can go blank for reasons no
 * visitor can see or fix. These tests run with JavaScript switched off entirely
 * — the extreme case of a bundle that failed to load, a corporate proxy, or a
 * script error early in hydration — and require the content to be there anyway.
 */
test.describe('with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });

  const paths = ['/', '/management', '/about', '/listings', '/blog'];

  for (const path of paths) {
    test(`${path} shows its content`, async ({ page }) => {
      await page.goto(path);

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Nothing is left in the armed (opacity 0) state, because nothing ever
      // armed: the state is only entered by script that can also leave it.
      await expect(page.locator('[data-reveal="armed"]')).toHaveCount(0);

      // Content far below the fold — the part a reveal animation would have
      // hidden — is present and visible.
      const footer = page.getByRole('contentinfo');
      await footer.scrollIntoViewIfNeeded();
      await expect(footer).toBeVisible();

      const hidden = await page.evaluate(() => {
        const candidates = Array.from(document.querySelectorAll('main p, main h2, main li'));
        return candidates.filter((element) => {
          const style = getComputedStyle(element);
          return Number.parseFloat(style.opacity) === 0 || style.visibility === 'hidden';
        }).length;
      });

      expect(hidden, 'content is invisible without JavaScript').toBe(0);
    });
  }

  test('the division page still lists its services as real links', async ({ page }) => {
    await page.goto('/management');

    const services = page.getByRole('link', { name: 'ניהול נכסים להשכרה' });
    await expect(services).toBeVisible();
    await expect(services).toHaveAttribute('href', '/services/rental-management');
  });
});

/**
 * The mobile menu removes the page behind it from the accessibility tree, not
 * just from the tab order. A focus trap holds Tab; a screen reader's virtual
 * cursor does not use Tab, and would otherwise read and activate the whole page
 * behind a panel the user cannot see.
 */
test('the open mobile menu makes the rest of the page inert', async ({ page }) => {
  await page.goto('/about');
  await waitForHydration(page);

  const toggle = page.getByRole('button', { name: 'תפריט', exact: true });
  if (!(await toggle.isVisible())) test.skip();

  await toggle.click();
  await expect(page.getByRole('dialog', { name: 'תפריט ראשי' })).toBeVisible();

  await expect(page.locator('main')).toHaveAttribute('inert', '');
  await expect(page.locator('footer')).toHaveAttribute('inert', '');

  // Inert is enforced by the browser: a link behind the panel cannot take focus
  // and cannot be activated.
  const focusEscaped = await page.evaluate(() => {
    const link = document.querySelector('main a');
    if (link instanceof HTMLElement) link.focus();
    return document.activeElement instanceof Element
      ? Boolean(document.activeElement.closest('main'))
      : false;
  });

  expect(focusEscaped).toBe(false);

  await page.keyboard.press('Escape');
  await expect(page.locator('main')).not.toHaveAttribute('inert', '');
});
