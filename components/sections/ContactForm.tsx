'use client';

/**
 * The form half of the contact section.
 *
 * It posts JSON to /api/contact, whose Zod schema is the authority on what is
 * valid — so this deliberately does NOT re-implement the rules. It marks the
 * required fields for the browser, submits, and then renders whatever the
 * server says, including the per-field errors the route returns in `fields`.
 * Two validators that disagree is worse than one that is occasionally a round
 * trip slower.
 *
 * The honeypot `company` input is the one field a real user never fills. It is
 * hidden from sight AND from assistive tech, and left out of the tab order, so
 * nobody using a screen reader is asked to fill a trap.
 */
import { useState } from 'react';

interface FieldErrors {
  [field: string]: string[] | undefined;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'error'; message: string; fields?: FieldErrors };

const FIELD =
  'mt-1.5 block w-full rounded border border-line bg-transparent px-3.5 py-2.5 text-base text-current placeholder:text-ink-muted focus:border-brass focus:outline-none';

export function ContactForm({ pageSlug }: { pageSlug: string }) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    setStatus({ kind: 'sending' });

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, pageSlug }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        fields?: FieldErrors;
      };

      if (res.ok && data.ok) {
        setStatus({ kind: 'sent' });
        form.reset();
        return;
      }
      setStatus({
        kind: 'error',
        message: data.error ?? 'שליחת הטופס נכשלה. נסו שוב.',
        fields: data.fields,
      });
    } catch {
      setStatus({
        kind: 'error',
        message: 'לא הצלחנו לשלוח את הטופס. בדקו את החיבור ונסו שוב.',
      });
    }
  }

  const fieldError = (name: string) =>
    status.kind === 'error' ? status.fields?.[name]?.[0] : undefined;

  if (status.kind === 'sent') {
    return (
      <div role="status" className="border-s-2 border-signal py-2 ps-5">
        <p className="text-lg font-semibold">תודה, פנייתכם התקבלה.</p>
        <p className="mt-2 text-base text-ink-muted">נציג מקיסר יחזור אליכם בהקדם.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="text-sm font-semibold">
            שם מלא
          </label>
          <input id="cf-name" name="name" required autoComplete="name" className={FIELD} />
          {fieldError('name') ? (
            <p className="mt-1 text-sm text-accent-text">{fieldError('name')}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="cf-phone" className="text-sm font-semibold">
            טלפון
          </label>
          <input
            id="cf-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            className={`${FIELD} text-start`}
          />
          {fieldError('phone') ? (
            <p className="mt-1 text-sm text-accent-text">{fieldError('phone')}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="cf-email" className="text-sm font-semibold">
          דוא&quot;ל
        </label>
        <input
          id="cf-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          className={`${FIELD} text-start`}
        />
        {fieldError('email') ? (
          <p className="mt-1 text-sm text-accent-text">{fieldError('email')}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="cf-message" className="text-sm font-semibold">
          במה נוכל לעזור?
        </label>
        <textarea id="cf-message" name="message" required rows={5} className={FIELD} />
        {fieldError('message') ? (
          <p className="mt-1 text-sm text-accent-text">{fieldError('message')}</p>
        ) : null}
      </div>

      {/* Honeypot: hidden from sight and from assistive tech, out of tab order. */}
      <div hidden aria-hidden>
        <label htmlFor="cf-company">אל תמלאו שדה זה</label>
        <input id="cf-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <button
        type="submit"
        disabled={status.kind === 'sending'}
        className="inline-flex items-center rounded-full bg-brass px-7 py-3.5 text-base font-semibold text-ink transition-colors hover:bg-brass-lift disabled:opacity-60"
      >
        {status.kind === 'sending' ? 'שולח…' : 'שליחה'}
      </button>

      {status.kind === 'error' ? (
        <p role="alert" className="text-sm font-semibold text-accent-text">
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
