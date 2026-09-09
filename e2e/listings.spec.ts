import { expect, test, waitForHydration } from './fixtures';

/**
 * The listings index and one property, in a real browser.
 *
 * Two claims are being defended here. The first is that the filters are honest:
 * they narrow a list that is fully present in the prerendered HTML, they say how
 * many of the total are showing, and they put their state in the URL so a
 * filtered view can be linked — which is also what makes the legacy
 * `property_buyorrent` archives redirectable.
 *
 * The second is that nothing on these pages invents a fact about someone's
 * property: no price where none is published, no photograph where none exists,
 * and no `offers` node in the structured data either.
 */
test('lists every property in the prerendered HTML, before any filtering', async ({ request }) => {
  const html = await (await request.get('/listings')).text();

  expect(html).toContain('מגרש בקו ראשון לים בנתניה');
  expect(html).toContain('בניין משרדים בתל אביב, מושכר לטווח ארוך');
});

test('filters by city, keeps the choice in the URL, and reports the count', async ({ page }) => {
  await page.goto('/listings');
  await waitForHydration(page);

  const cards = page.getByRole('article');
  const total = await cards.count();
  expect(total).toBeGreaterThan(1);

  await page.getByLabel('עיר').selectOption('נתניה');

  await expect(page).toHaveURL(/city=/);
  await expect(cards).toHaveCount(1);
  await expect(page.getByText(`1 מתוך ${total} נכסים`)).toBeVisible();

  // And the filtered view survives a reload, because it is in the URL.
  await page.reload();
  await waitForHydration(page);
  await expect(page.getByRole('article')).toHaveCount(1);
});

test('accepts the legacy deal taxonomy term the redirect map targets', async ({ page }) => {
  await page.goto('/listings?deal=sale');
  await waitForHydration(page);

  const cards = page.getByRole('article');
  await expect(cards.first()).toBeVisible();

  for (const text of await cards.allInnerTexts()) {
    expect(text).toContain('למכירה');
  }
});

test('offers a way forward when a filter matches nothing', async ({ page }) => {
  await page.goto('/listings?city=%D7%A0%D7%AA%D7%A0%D7%99%D7%94&asset=apartment');
  await waitForHydration(page);

  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'ספרו לנו מה אתם מחפשים' })).toBeVisible();
});

test('never shows a price for a property that does not publish one', async ({ page }) => {
  await page.goto('/listings');

  const main = page.locator('main');
  await expect(main.getByText('מחיר לפי פנייה').first()).toBeVisible();

  // No currency figure anywhere on the index.
  expect(await main.innerText()).not.toMatch(/[₪$]\s*[\d,]/);
});

test('the property page states the missing price and the missing photographs', async ({ page }) => {
  await page.goto('/listings/netanya-seafront-plot');

  await expect(page.getByText('מחיר לפי פנייה')).toBeVisible();
  await expect(page.getByText(/עדיין לא פרסמנו תמונות/)).toBeVisible();
  // 7 dunam, which is the client's own figure and is therefore shown.
  await expect(page.getByText('7,000 מ״ר')).toBeVisible();
});

test('emits RealEstateListing structured data, with no offer and no invented rating', async ({
  request,
}) => {
  const html = await (await request.get('/listings/netanya-seafront-plot')).text();

  // react-helmet stamps its own attribute onto the tag it manages, so the
  // opening tag is matched loosely rather than by an exact string.
  const match = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  expect(match, 'no JSON-LD block in the prerendered HTML').not.toBeNull();

  const parsed = JSON.parse(match?.[1] ?? '[]') as Array<Record<string, unknown>>;
  const listing = parsed.find((node) => node['@type'] === 'RealEstateListing');

  expect(listing).toBeDefined();
  expect(listing?.name).toBe('מגרש בקו ראשון לים בנתניה');
  // No price published, so no offer — a property priced on application is not
  // a property priced at zero.
  expect(listing?.offers).toBeUndefined();
  expect(html).not.toContain('aggregateRating');
});
