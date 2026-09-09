import { http, HttpResponse } from 'msw';

import {
  isHoneypotTripped,
  leadSchema,
  RATE_LIMIT,
  toLeadErrors,
  type LeadResponse,
} from '../../api/_schemas/lead';

/**
 * Mock `POST /api/lead` for UI tests.
 *
 * Derived from the same Zod schema the real handler uses, so a form that passes
 * against these mocks passes against production. A hand-written mock that
 * accepts anything is worse than no mock: it lets a broken form ship green.
 *
 * Test-only module. Nothing in the shipped bundle imports it, and it must stay
 * that way — `msw` is a devDependency.
 */

const TEST_HEADERS = { 'Cache-Control': 'no-store' };

function respond(payload: LeadResponse, status: number, headers: Record<string, string> = {}) {
  return HttpResponse.json(payload, { status, headers: { ...TEST_HEADERS, ...headers } });
}

/**
 * The happy path, with the real validation behind it.
 *
 * Honeypot submissions get the same 202 a real one does, exactly as production
 * does, so a test cannot accidentally assert on a tell that does not exist.
 */
export const leadHandler = http.post('/api/lead', async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond({ ok: false, errors: { form: 'שגיאה בשליחת הטופס. נסו שוב.' } }, 400);
  }

  if (isHoneypotTripped(body)) return respond({ ok: true }, 202);

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) return respond({ ok: false, errors: toLeadErrors(parsed.error) }, 400);

  return respond({ ok: true }, 202);
});

/** Default set, for `setupServer(...leadHandlers)`. */
export const leadHandlers = [leadHandler];

/**
 * Failure modes, as `server.use(...)` overrides.
 *
 * The 429 and 500 branches are states the UI must handle — a retry-after notice
 * and the phone-number fallback — and neither is reachable by sending valid
 * input, so they have to be forced.
 */
export const leadScenarios = {
  rateLimited: (retryAfter = RATE_LIMIT.windowMs / 1000) =>
    http.post('/api/lead', () =>
      respond({ ok: false, error: 'rate_limited', retryAfter }, 429, {
        'Retry-After': String(retryAfter),
      }),
    ),

  serverError: () =>
    http.post('/api/lead', () => respond({ ok: false, error: 'server_error' }, 500)),

  /** A delivery that never resolves, for testing the pending state. */
  hangs: () => http.post('/api/lead', () => new Promise<never>(() => {})),
};
