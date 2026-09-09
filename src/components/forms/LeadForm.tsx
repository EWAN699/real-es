import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation } from 'react-router-dom';

import {
  LEAD_TOPICS,
  leadSchema,
  leadTopicLabels,
  toLeadErrors,
  type LeadErrors,
  type LeadTopic,
} from '../../../api/_schemas/lead';
import { contact, telHref, whatsappHref } from '@/content/contact';
import { Button } from '@/components/ui/Button';
import { Field, Honeypot, Input, Select, Textarea } from '@/components/ui/Field';

/**
 * The single lead-capture form, wired to `POST /api/lead`.
 *
 * Validation is the Zod schema from `api/_schemas/lead.ts` — the same object the
 * serverless handler and the MSW mocks use. The contract requires that: a form
 * with its own hand-rolled copy of the rules drifts from the server the first
 * time either side is edited, and the drift shows up as a rejection the user
 * cannot see the reason for. The server still validates independently; this is
 * here to spare a round trip, never as the security boundary.
 *
 * Response handling, per docs/API_CONTRACT.md:
 *  - `202` is success, and is also what a discarded honeypot submission gets.
 *    The server does not tell a bot it was caught, so neither does this.
 *  - `400` carries Hebrew per-field messages that never echo submitted values,
 *    so they are safe to render verbatim. Focus moves to the first bad field.
 *  - `429` and `500` fall back to the phone number. A lead that cannot be
 *    submitted is still a lead.
 *  - `404` and `405` mean the endpoint is not there at all — a static host with
 *    no serverless functions, which is exactly what a GitHub Pages demo build
 *    is. The form says the submission was NOT sent and hands over the phone,
 *    WhatsApp and email, which do work. It never shows the confirmation for a
 *    lead that went nowhere: only a `202` is success.
 *
 * Every failure branch renders the direct channels alongside the message, so
 * "the form did not work" is never the end of the conversation.
 */
export type LeadFormProps = {
  /** Routes the notification. Fixed per page unless `selectableTopic` is set. */
  topic: LeadTopic;
  /** Renders the topic selector — for the contact page, where it is not implied. */
  selectableTopic?: boolean;
  submitLabel?: string;
};

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

const initialValues = { name: '', phone: '', email: '', message: '' };

const FIELD_ORDER = ['name', 'phone', 'email', 'message'] as const;

export function LeadForm({ topic, selectableTopic = false, submitLabel = 'שליחה' }: LeadFormProps) {
  const { pathname } = useLocation();
  const [values, setValues] = useState(initialValues);
  const [selectedTopic, setSelectedTopic] = useState<LeadTopic>(topic);
  const [company, setCompany] = useState('');
  const [errors, setErrors] = useState<LeadErrors>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const successRef = useRef<HTMLDivElement>(null);

  // The confirmation replaces the form, so focus has to follow it. The live
  // region alone would leave keyboard focus on a button that no longer exists,
  // and the browser drops it to the top of the document.
  useEffect(() => {
    if (status.kind === 'success') successRef.current?.focus();
  }, [status.kind]);

  function update(field: keyof typeof initialValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function focusFirstError(fieldErrors: LeadErrors) {
    const first = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (!first) return;

    document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  function reject(fieldErrors: LeadErrors) {
    setErrors(fieldErrors);
    setStatus(
      fieldErrors.form ? { kind: 'error', message: fieldErrors.form } : { kind: 'idle' },
    );
    focusFirstError(fieldErrors);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = leadSchema.safeParse({
      name: values.name,
      phone: values.phone,
      email: values.email,
      message: values.message,
      topic: selectedTopic,
      sourcePath: pathname,
    });

    if (!parsed.success) {
      reject(toLeadErrors(parsed.error));
      return;
    }

    setErrors({});
    setStatus({ kind: 'submitting' });

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, company }),
      });

      if (response.status === 202) {
        setValues(initialValues);
        setStatus({ kind: 'success' });
        return;
      }

      if (response.status === 400) {
        const body = (await response.json()) as { errors?: LeadErrors };
        reject(body.errors ?? { form: 'שגיאה בשליחת הטופס. נסו שוב.' });
        return;
      }

      if (response.status === 404 || response.status === 405) {
        // No endpoint behind this deployment. Saying "try again" would be a lie:
        // a retry cannot succeed, and the visitor's message is still on screen
        // for them to copy into WhatsApp or an email.
        setStatus({
          kind: 'error',
          message:
            'הטופס אינו פעיל בגרסה הזו של האתר, והפנייה לא נשלחה. אפשר לפנות אלינו ישירות בערוצים הבאים:',
        });
        return;
      }

      if (response.status === 429) {
        setStatus({
          kind: 'error',
          message: `נשלחו יותר מדי פניות מהמכשיר הזה. אפשר לנסות שוב בעוד מספר דקות, או להתקשר ל־${contact.nationalPhone}.`,
        });
        return;
      }

      setStatus({
        kind: 'error',
        message: `הפנייה לא נשלחה. אפשר לנסות שוב, או להתקשר אלינו ל־${contact.nationalPhone}.`,
      });
    } catch {
      setStatus({
        kind: 'error',
        message: `אין כרגע חיבור לשרת. אפשר להתקשר אלינו ל־${contact.nationalPhone}.`,
      });
    }
  }

  if (status.kind === 'success') {
    return (
      <div
        ref={successRef}
        role="status"
        tabIndex={-1}
        className="rounded-lg border border-brand-600 bg-stone-50 p-6 text-ink-900"
      >
        <p className="text-h3 font-bold">תודה, הפנייה התקבלה.</p>
        <p className="mt-2 text-body text-ink-600">
          נחזור אליכם בהקדם. אם זה דחוף, אפשר להתקשר{' '}
          <a
            href={telHref(contact.nationalPhone)}
            className="tabular font-semibold text-brand-700 underline underline-offset-4"
            dir="ltr"
          >
            {contact.nationalPhone}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative flex flex-col gap-5">
      <Honeypot value={company} onChange={setCompany} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="שם מלא" required error={errors.name}>
          <Input
            name="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={(event) => update('name', event.target.value)}
          />
        </Field>

        <Field label="טלפון" required hint="לדוגמה: 052-1234567" error={errors.phone}>
          <Input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            className="text-start"
            value={values.phone}
            onChange={(event) => update('phone', event.target.value)}
          />
        </Field>
      </div>

      <Field label="אימייל" error={errors.email}>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          dir="ltr"
          className="text-start"
          value={values.email}
          onChange={(event) => update('email', event.target.value)}
        />
      </Field>

      {selectableTopic ? (
        <Field label="נושא הפנייה" required error={errors.topic}>
          <Select
            name="topic"
            value={selectedTopic}
            onChange={(event) => setSelectedTopic(event.target.value as LeadTopic)}
          >
            {LEAD_TOPICS.map((value) => (
              <option key={value} value={value}>
                {leadTopicLabels[value]}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Field label="במה נוכל לעזור?" error={errors.message}>
        <Textarea
          name="message"
          rows={4}
          maxLength={2000}
          value={values.message}
          onChange={(event) => update('message', event.target.value)}
        />
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={status.kind === 'submitting'}>
          {status.kind === 'submitting' ? 'שולח…' : submitLabel}
        </Button>

        <p className="text-small text-ink-600">
          הפרטים נשמרים אצלנו בלבד ומשמשים ליצירת קשר. אין שימוש ב־CAPTCHA של צד שלישי.
        </p>
      </div>

      {/*
       * The live region is always in the DOM, so a message put into it later is
       * announced — a region created at the same moment as its content is
       * frequently missed.
       */}
      <p role="status" className="text-small font-semibold text-brand-700">
        {status.kind === 'error' ? status.message : ''}
      </p>

      {status.kind === 'error' ? <DirectChannels /> : null}
    </form>
  );
}

/**
 * The channels that work when the form does not: a dialable number, WhatsApp
 * and an email address. Rendered under every failure message.
 */
function DirectChannels() {
  return (
    <ul className="flex flex-col gap-2 text-small">
      <li>
        <a
          href={telHref(contact.nationalPhone)}
          className="tabular font-semibold text-brand-700 underline underline-offset-4 hover:text-ink-900"
          dir="ltr"
        >
          {contact.nationalPhone}
        </a>
      </li>
      <li>
        <a
          href={whatsappHref('שלום, ניסיתי לשלוח פנייה דרך האתר')}
          className="font-semibold text-brand-700 underline underline-offset-4 hover:text-ink-900"
        >
          וואטסאפ
        </a>
      </li>
      <li>
        <a
          href={`mailto:${contact.email}`}
          className="font-semibold text-brand-700 underline underline-offset-4 hover:text-ink-900"
          dir="ltr"
        >
          {contact.email}
        </a>
      </li>
    </ul>
  );
}
