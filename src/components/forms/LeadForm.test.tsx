import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { leadHandler, leadScenarios } from '@/lib/msw-handlers';

import { LeadForm } from './LeadForm';

/**
 * The endpoint is mocked at the network boundary, with the same Zod schema the
 * real handler validates against — so what these tests exercise is the request
 * the form actually puts on the wire, judged by production's own rules. A
 * hand-written mock that accepts anything would let a broken form ship green.
 */
let lastRequestBody: Record<string, unknown> | null = null;

const recordingHandler = http.post('/api/lead', async ({ request }) => {
  lastRequestBody = (await request.clone().json()) as Record<string, unknown>;
  return undefined;
});

const server = setupServer(recordingHandler, leadHandler);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  lastRequestBody = null;
});
afterEach(() => server.resetHandlers(recordingHandler, leadHandler));
afterAll(() => server.close());

function renderForm(path = '/', props: Partial<{ selectableTopic: boolean }> = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LeadForm topic="valuation" {...props} />
    </MemoryRouter>,
  );
}

async function fillValidLead() {
  await userEvent.type(screen.getByLabelText(/שם מלא/), 'ישראל ישראלי');
  await userEvent.type(screen.getByLabelText(/טלפון/), '052-1234567');
}

function submit() {
  return userEvent.click(screen.getByRole('button', { name: 'שליחה' }));
}

describe('LeadForm', () => {
  it('sends the payload shape the API contract specifies', async () => {
    renderForm('/management');
    await fillValidLead();
    await userEvent.type(screen.getByLabelText(/אימייל/), 'a@b.co.il');
    await submit();

    await waitFor(() => expect(lastRequestBody).not.toBeNull());
    expect(lastRequestBody).toMatchObject({
      name: 'ישראל ישראלי',
      phone: '052-1234567',
      email: 'a@b.co.il',
      topic: 'valuation',
      sourcePath: '/management',
      company: '',
    });
  });

  it('confirms on 202 and moves focus to the confirmation', async () => {
    renderForm();
    await fillValidLead();
    await submit();

    const confirmation = await screen.findByRole('status');
    expect(confirmation).toHaveTextContent('הפנייה התקבלה');
    await waitFor(() => expect(confirmation).toHaveFocus());
  });

  it('validates before the round trip and puts focus on the first bad field', async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText(/טלפון/), 'not-a-phone');
    await submit();

    expect(lastRequestBody).toBeNull();
    expect(screen.getByLabelText(/שם מלא/)).toHaveFocus();
    expect(screen.getByLabelText(/שם מלא/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('מספר הטלפון אינו תקין. לדוגמה: 052-1234567')).toBeInTheDocument();
  });

  it.each(['0521234567', '052-123-4567', '+972 52 123 4567', '(03) 6120200'])(
    'accepts %s, because rejecting a real customer over a hyphen loses the lead',
    async (phone) => {
      renderForm();
      await userEvent.type(screen.getByLabelText(/שם מלא/), 'ישראל ישראלי');
      await userEvent.type(screen.getByLabelText(/טלפון/), phone);
      await submit();

      expect(await screen.findByRole('status')).toHaveTextContent('הפנייה התקבלה');
    },
  );

  it('renders the Hebrew field message a server 400 returns', async () => {
    // Forced through the real schema by sending a name the client would also
    // reject, so the assertion is on the rendering path, not the mock.
    server.use(
      http.post('/api/lead', () =>
        HttpResponse.json(
          { ok: false, errors: { phone: 'מספר הטלפון אינו תקין. לדוגמה: 052-1234567' } },
          { status: 400 },
        ),
      ),
    );

    renderForm();
    await fillValidLead();
    await submit();

    expect(
      await screen.findByText('מספר הטלפון אינו תקין. לדוגמה: 052-1234567'),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/טלפון/)).toHaveFocus());
  });

  it('offers the phone number when the server rate-limits', async () => {
    server.use(leadScenarios.rateLimited());

    renderForm();
    await fillValidLead();
    await submit();

    expect(await screen.findByText(/יותר מדי פניות/)).toBeInTheDocument();
  });

  it('offers the phone number when delivery fails, rather than a dead end', async () => {
    server.use(leadScenarios.serverError());

    renderForm();
    await fillValidLead();
    await submit();

    expect(await screen.findByText(/להתקשר אלינו/)).toBeInTheDocument();
  });

  it('says the lead was not sent when the endpoint does not exist, and offers the channels that work', async () => {
    // A static deployment with no serverless functions — the GitHub Pages demo
    // build — answers a POST to /api/lead with a 404.
    server.use(http.post('/api/lead', () => new HttpResponse(null, { status: 404 })));

    renderForm();
    await fillValidLead();
    await submit();

    expect(await screen.findByText(/הפנייה לא נשלחה/)).toBeInTheDocument();
    // Never the confirmation: a lead that went nowhere is not a lead received.
    expect(screen.queryByText(/הפנייה התקבלה/)).toBeNull();

    expect(screen.getByRole('link', { name: 'וואטסאפ' }).getAttribute('href')).toMatch(
      /^https:\/\/wa\.me\/\d+/,
    );
    expect(
      screen.getAllByRole('link').some((link) => link.getAttribute('href')?.startsWith('tel:')),
    ).toBe(true);

    // The typed message is still on screen to copy, not thrown away.
    expect(screen.getByLabelText(/שם מלא/)).toHaveValue('ישראל ישראלי');
  });

  it('keeps the visitor informed when the network is gone', async () => {
    server.use(http.post('/api/lead', () => HttpResponse.error()));

    renderForm();
    await fillValidLead();
    await submit();

    expect(await screen.findByText(/אין כרגע חיבור לשרת/)).toBeInTheDocument();
  });

  it('disables the submit button while the request is in flight', async () => {
    server.use(leadScenarios.hangs());

    renderForm();
    await fillValidLead();
    await submit();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'שולח…' })).toBeDisabled(),
    );
  });

  it('carries the honeypot field, empty, out of the tab order', async () => {
    const { container } = renderForm();

    const honeypot = container.querySelector<HTMLInputElement>('input[name="company"]');
    expect(honeypot?.value).toBe('');
    expect(honeypot).toHaveAttribute('tabindex', '-1');

    screen.getByLabelText(/שם מלא/).focus();
    await userEvent.tab();
    expect(document.activeElement).not.toBe(honeypot);
  });

  it('offers every contract topic when the page does not imply one', async () => {
    renderForm('/contact', { selectableTopic: true });

    const select = screen.getByLabelText(/נושא הפנייה/);
    expect(select.tagName).toBe('SELECT');
    expect(within(select).getAllByRole('option')).toHaveLength(6);

    await userEvent.selectOptions(select, 'franchise');
    await fillValidLead();
    await submit();

    await waitFor(() => expect(lastRequestBody).toMatchObject({ topic: 'franchise' }));
  });
});
