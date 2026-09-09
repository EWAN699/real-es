import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isHoneypotTripped,
  leadSchema,
  normalizeIsraeliPhone,
  RATE_LIMIT,
} from '../../api/_schemas/lead';
import { checkRateLimit, createLeadHandler, formatLeadEmail } from '../../api/lead';

// Lives under src/ so vitest's `include` picks it up; the code under test is in api/.

const validLead = {
  name: 'ישראל ישראלי',
  phone: '052-1234567',
  topic: 'management',
  sourcePath: '/services/property-management',
};

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://www.caesar.co.il/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

describe('phone validation', () => {
  it.each([
    '052-1234567',
    '0521234567',
    '+972-52-1234567',
    '972521234567',
    '03-1234567',
    '(09) 123 4567',
  ])('accepts %s', (input) => {
    expect(normalizeIsraeliPhone(input)).not.toBeNull();
  });

  it.each(['', '12345', '05-1234567', '+1 415 555 2671', 'לא מספר'])('rejects %s', (input) => {
    expect(normalizeIsraeliPhone(input)).toBeNull();
  });
});

describe('schema', () => {
  it('accepts a minimal valid lead', () => {
    expect(leadSchema.safeParse(validLead).success).toBe(true);
  });

  it('treats an empty email as absent rather than invalid', () => {
    const parsed = leadSchema.safeParse({ ...validLead, email: '' });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBeUndefined();
  });

  it('rejects a sourcePath that is not a local path', () => {
    for (const sourcePath of ['https://evil.example/x', '//evil.example/x', 'services']) {
      expect(leadSchema.safeParse({ ...validLead, sourcePath }).success).toBe(false);
    }
  });

  it('never echoes a submitted value in an error message', () => {
    const parsed = leadSchema.safeParse({
      ...validLead,
      name: '<script>alert(1)</script>',
      phone: '<img onerror=x>',
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message).join(' ');
      expect(messages).not.toContain('script');
      expect(messages).not.toContain('<');
    }
  });

  it('spots a filled honeypot and ignores an empty one', () => {
    expect(isHoneypotTripped({ company: 'Acme' })).toBe(true);
    expect(isHoneypotTripped({ company: '   ' })).toBe(false);
    expect(isHoneypotTripped({})).toBe(false);
  });
});

describe('POST /api/lead', () => {
  it('accepts a valid lead with 202 and delivers it', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const handler = createLeadHandler({ send, store: new Map() });

    const response = await handler(post(validLead));

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('answers a honeypot hit exactly like a success, and delivers nothing', async () => {
    const send = vi.fn();
    const handler = createLeadHandler({ send, store: new Map() });

    const response = await handler(post({ ...validLead, company: 'bot inc' }));

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(send).not.toHaveBeenCalled();
  });

  it('returns Hebrew field errors on 400', async () => {
    const handler = createLeadHandler({ send: vi.fn(), store: new Map() });

    const response = await handler(post({ ...validLead, name: 'א', phone: '123' }));

    expect(response.status).toBe(400);
    const body = (await response.json()) as { ok: false; errors: Record<string, string> };
    expect(body.ok).toBe(false);
    expect(body.errors.name).toMatch(/[֐-׿]/);
    expect(body.errors.phone).toMatch(/[֐-׿]/);
  });

  it('rejects a malformed body without throwing', async () => {
    const handler = createLeadHandler({ send: vi.fn(), store: new Map() });
    const request = new Request('https://www.caesar.co.il/api/lead', {
      method: 'POST',
      body: 'not json',
    });

    expect((await handler(request)).status).toBe(400);
  });

  it('rate limits the sixth submission from one IP', async () => {
    const store = new Map<string, number[]>();
    const handler = createLeadHandler({ send: vi.fn().mockResolvedValue(undefined), store });
    const headers = { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' };

    for (let i = 0; i < RATE_LIMIT.max; i += 1) {
      expect((await handler(post(validLead, headers))).status).toBe(202);
    }

    const response = await handler(post(validLead, headers));
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBeTruthy();
    const body = (await response.json()) as { error: string; retryAfter: number };
    expect(body.error).toBe('rate_limited');
    expect(body.retryAfter).toBeGreaterThan(0);
  });

  it('counts each IP separately', async () => {
    const store = new Map<string, number[]>();
    const handler = createLeadHandler({ send: vi.fn().mockResolvedValue(undefined), store });

    for (let i = 0; i < RATE_LIMIT.max; i += 1) {
      await handler(post(validLead, { 'x-forwarded-for': '203.0.113.9' }));
    }

    const other = await handler(post(validLead, { 'x-forwarded-for': '198.51.100.4' }));
    expect(other.status).toBe(202);
  });

  it('does not spend rate-limit budget on honeypot hits', async () => {
    const store = new Map<string, number[]>();
    const handler = createLeadHandler({ send: vi.fn().mockResolvedValue(undefined), store });
    const headers = { 'x-forwarded-for': '203.0.113.9' };

    for (let i = 0; i < 20; i += 1) {
      await handler(post({ ...validLead, company: 'bot' }, headers));
    }

    expect((await handler(post(validLead, headers))).status).toBe(202);
  });

  it('returns 500 when delivery fails, rather than pretending to succeed', async () => {
    const handler = createLeadHandler({
      send: vi.fn().mockRejectedValue(new Error('resend responded 502')),
      store: new Map(),
    });

    const response = await handler(post(validLead));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ ok: false, error: 'server_error' });
  });

  it('rejects anything but POST', async () => {
    const handler = createLeadHandler({ send: vi.fn(), store: new Map() });
    const response = await handler(
      new Request('https://www.caesar.co.il/api/lead', { method: 'GET' }),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('POST');
  });
});

describe('logging', () => {
  it('logs the topic, path and outcome — and no personal data', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const handler = createLeadHandler({
      send: vi.fn().mockResolvedValue(undefined),
      store: new Map(),
    });

    await handler(
      post({
        ...validLead,
        email: 'dana@example.co.il',
        message: 'מעוניינת בהערכת שווי',
      }),
    );

    const logged = info.mock.calls.map((call) => String(call[0])).join('\n');
    expect(logged).toContain('"outcome":"accepted"');
    expect(logged).toContain('"topic":"management"');
    expect(logged).toContain('"sourcePath":"/services/property-management"');
    expect(logged).not.toContain('052');
    expect(logged).not.toContain('1234567');
    expect(logged).not.toContain('dana@example.co.il');
    expect(logged).not.toContain('ישראל ישראלי');
    expect(logged).not.toContain('הערכת שווי');
  });

  it('caps attacker-controlled fields on the failure paths', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const handler = createLeadHandler({ send: vi.fn(), store: new Map() });

    await handler(post({ ...validLead, phone: 'x', sourcePath: `/${'a'.repeat(5000)}` }));

    const logged = info.mock.calls.map((call) => String(call[0])).join('\n');
    expect(logged.length).toBeLessThan(600);
  });
});

describe('notification body', () => {
  it('carries the details the office needs, in normalised form', () => {
    const email = formatLeadEmail({
      name: 'דנה כהן',
      phone: '+972-52-1234567',
      topic: 'valuation',
      sourcePath: '/services/valuation',
      email: 'dana@example.co.il',
      message: 'מעוניינת בהערכת שווי',
    });

    expect(email).toContain('דנה כהן');
    expect(email).toContain('0521234567');
    expect(email).toContain('/services/valuation');
  });

  it('says so plainly when no email was given', () => {
    expect(formatLeadEmail({ ...validLead, topic: 'general' } as never)).toContain('לא נמסר');
  });
});

describe('rate-limit window', () => {
  it('lets the counter lapse once the window has passed', () => {
    const store = new Map<string, number[]>();
    const start = 1_000_000;

    for (let i = 0; i < RATE_LIMIT.max; i += 1) {
      expect(checkRateLimit(store, 'ip', start + i).allowed).toBe(true);
    }
    expect(checkRateLimit(store, 'ip', start + RATE_LIMIT.max).allowed).toBe(false);
    expect(checkRateLimit(store, 'ip', start + RATE_LIMIT.windowMs + 1).allowed).toBe(true);
  });
});
