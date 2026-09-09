import { expect, test, waitForHydration } from './fixtures';

/**
 * The rules the content layer encodes, enforced at the page level.
 *
 * Each of these has a counterpart in `src/content`: a `confirmed` flag on every
 * statistic, a `PENDING_DATE` sentinel on every post, an excerpt that repeats
 * the title, an absent `price`, an empty gallery. The data layer refuses to
 * invent them; these tests prove the interface does not quietly fill them in.
 */
test('no page publishes an unconfirmed track-record figure', async ({ page }) => {
  for (const path of ['/', '/about', '/management']) {
    await page.goto(path);

    const text = await page.locator('main').innerText();

    // The legacy counters: 7 franchisees, 9 experts, 216 projects, a survey
    // score of 69, 7+ years. Every one is unconfirmed, and two contradict the
    // client's own copy on the same page.
    expect(text).not.toContain('216');
    expect(text).not.toContain('זכיינים לרשותכם');
    expect(text).not.toContain('ציון בסקר לקוחות');
    expect(text, `${path} quotes a years-of-experience figure`).not.toMatch(
      /\d+\+?\s*שנות ניסיון/,
    );
  }
});

test('the archives print no date while the real dates are unknown', async ({ page }) => {
  for (const path of ['/blog', '/news']) {
    await page.goto(path);

    const main = page.locator('main');
    // The sentinel is 1900-01-01, chosen to be obviously wrong. Neither it nor
    // any formatted version of it may reach a reader.
    expect(await main.innerText()).not.toContain('1900');
    await expect(main.locator('time')).toHaveCount(0);
  }
});

test('a post page shows its title once, and does not repeat it as a teaser', async ({ page }) => {
  await page.goto(`/blog/${encodeURIComponent('מוכר-דירה')}`);

  const title = 'מוכר דירה? איך לעצב את הדירה בכלום כסף שתיראה לקונים מיליון דולר';
  const body = await page.locator('main').innerText();
  const occurrences = body.split(title).length - 1;

  // Once in the h1 and once in the breadcrumb's current-page item; never a
  // third time as an "excerpt" that is only the title again.
  expect(occurrences).toBeLessThanOrEqual(2);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
});

test('a post with no body is not offered to search engines', async ({ request }) => {
  const html = await (await request.get(`/blog/${encodeURIComponent('מוכר-דירה')}`)).text();

  // The URL stays alive for a person following a ten-year-old link; a hundred
  // headline-only pages in the index is a doorway-page problem.
  expect(html).toMatch(/<meta[^>]*name="robots"[^>]*content="noindex/);
});

test('the testimonials are the customers own words, with no fabricated rating', async ({
  page,
  request,
}) => {
  await page.goto('/testimonials');

  await expect(page.getByRole('article').or(page.locator('figure')).first()).toBeVisible();
  await expect(page.getByText('לקיסר היקר, תודה על הטיפול')).toBeVisible();

  const html = await (await request.get('/testimonials')).text();
  expect(html).not.toContain('aggregateRating');
  expect(html).not.toContain('ratingValue');
});

test('the lead form never claims success without the endpoint answering', async ({ page }) => {
  await page.goto('/contact');
  // The form's submit handler exists only once the client has taken over;
  // before that the browser would do its own GET submit.
  await waitForHydration(page);

  // A static deployment has no /api/lead. The form must say the lead was not
  // sent and hand over the channels that work, not show the confirmation.
  await page.route('**/api/lead', (route) => route.fulfill({ status: 404, body: '' }));

  await page.getByLabel(/שם מלא/).fill('ישראל ישראלי');
  await page.getByLabel(/טלפון/).fill('052-1234567');
  await page.getByRole('button', { name: 'שליחת הפנייה' }).click();

  await expect(page.getByText(/הפנייה לא נשלחה/)).toBeVisible();
  await expect(page.getByText('הפנייה התקבלה')).toHaveCount(0);

  const whatsapp = page.locator('form').getByRole('link', { name: 'וואטסאפ' });
  await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\/\d+/);
});
