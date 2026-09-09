import { z } from 'zod';

/**
 * The lead-capture contract, in one place.
 *
 * Imported by the serverless handler, by the client form and by the MSW
 * handlers that back the UI tests, so the three cannot drift. See
 * `docs/API_CONTRACT.md`.
 *
 * Every message is Hebrew and is safe to render verbatim: they are fixed
 * strings that never interpolate anything the user typed. Echoing a submitted
 * value back into an error message is a reflected-XSS surface, and the contract
 * forbids it.
 */

export const LEAD_TOPICS = [
  'management',
  'construction',
  'investment',
  'valuation',
  'franchise',
  'general',
] as const;

export const leadTopic = z.enum(LEAD_TOPICS, {
  errorMap: () => ({ message: 'יש לבחור נושא לפנייה.' }),
});
export type LeadTopic = z.infer<typeof leadTopic>;

/** Hebrew labels for the topic selector. */
export const leadTopicLabels: Readonly<Record<LeadTopic, string>> = {
  management: 'ניהול נכסים',
  construction: 'בנייה, ניהול ויזמות',
  investment: 'יזמות עסקים והשקעות',
  valuation: 'הערכת שווי לנכס',
  franchise: 'זכיינות ושותפויות',
  general: 'פנייה כללית',
};

/**
 * Israeli mobile and landline numbers.
 *
 * Accepts the way people actually type them — spaces, hyphens, a leading +972,
 * a parenthesised area code — and judges the digits. Rejecting a real customer
 * over a hyphen loses a lead; that is the expensive failure here, not a slightly
 * permissive regex.
 */
export function normalizeIsraeliPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, '').replace(/^\+?972/, '0');
  if (!/^0\d+$/.test(digits)) return null;
  // Mobile and VoIP: 05x / 07x plus seven digits. Landline: area code 2,3,4,8,9
  // plus seven digits.
  if (/^0(5|7)\d{8}$/.test(digits)) return digits;
  if (/^0[23489]\d{7}$/.test(digits)) return digits;
  return null;
}

const phone = z
  .string({ required_error: 'יש להזין מספר טלפון.' })
  .trim()
  .min(1, 'יש להזין מספר טלפון.')
  .refine((value) => normalizeIsraeliPhone(value) !== null, {
    message: 'מספר הטלפון אינו תקין. לדוגמה: 052-1234567',
  });

/** The fields a person fills in. The honeypot is not one of them. */
export const leadSchema = z.object({
  name: z
    .string({ required_error: 'יש להזין שם.' })
    .trim()
    .min(2, 'יש להזין שם מלא.')
    .max(80, 'השם ארוך מדי.'),
  phone,
  email: z
    .string()
    .trim()
    .email('כתובת האימייל אינה תקינה.')
    .max(160, 'כתובת האימייל ארוכה מדי.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  message: z.string().trim().max(2000, 'ההודעה ארוכה מדי.').optional(),
  topic: leadTopic,
  sourcePath: z
    .string({ required_error: 'שגיאה בשליחת הטופס. נסו שוב.' })
    .trim()
    .min(1, 'שגיאה בשליחת הטופס. נסו שוב.')
    .max(512, 'שגיאה בשליחת הטופס. נסו שוב.')
    // A path, not a URL: it is recorded and logged, and an absolute URL here
    // would let a caller write arbitrary text into our logs and notifications.
    .refine((value) => value.startsWith('/') && !value.startsWith('//'), {
      message: 'שגיאה בשליחת הטופס. נסו שוב.',
    }),
});
export type Lead = z.infer<typeof leadSchema>;

/**
 * The wire shape, honeypot included.
 *
 * `company` is rendered off-screen and hidden from assistive technology, so a
 * human never sees it and never fills it. Anything that does is automated.
 */
export const leadRequestSchema = leadSchema.extend({
  company: z.string().optional(),
});
export type LeadRequest = z.infer<typeof leadRequestSchema>;

/** True when the honeypot was filled: discard the submission, answer 202. */
export function isHoneypotTripped(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false;
  const company = (body as { company?: unknown }).company;
  return typeof company === 'string' && company.trim() !== '';
}

export type LeadErrors = Partial<Record<keyof Lead | 'form', string>>;

/** Flatten a Zod failure into the `{ field: message }` shape the contract states. */
export function toLeadErrors(error: z.ZodError): LeadErrors {
  const errors: LeadErrors = {};
  for (const issue of error.issues) {
    const field = (issue.path[0] ?? 'form') as keyof LeadErrors;
    if (!errors[field]) errors[field] = issue.message;
  }
  return errors;
}

export type LeadResponse =
  | { ok: true }
  | { ok: false; errors: LeadErrors }
  | { ok: false; error: 'rate_limited'; retryAfter: number }
  | { ok: false; error: 'server_error' }
  | { ok: false; error: 'method_not_allowed' };

/** Rate limit, per the contract: 5 submissions per IP per 10 minutes. */
export const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 } as const;
