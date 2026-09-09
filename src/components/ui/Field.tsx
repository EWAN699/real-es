import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { createContext, useContext, useId } from 'react';

import { cn } from './cn';

/**
 * Form field primitives.
 *
 * `Field` owns the ids and the wiring; `Input`, `Textarea` and `Select` read
 * them from context. That makes the label/control association, the
 * `aria-describedby` chain and `aria-invalid` structural rather than something a
 * page author has to remember — which is exactly the class of mistake that
 * leaves a form unusable with a screen reader.
 *
 * Errors are rendered next to the control *and* announced: the container is a
 * polite live region so a validation failure after submit is not silent.
 */

type FieldContextValue = {
  controlId: string;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

function useFieldContext(component: string): FieldContextValue {
  const context = useContext(FieldContext);
  if (!context) {
    throw new Error(`<${component}> must be rendered inside a <Field>.`);
  }
  return context;
}

export type FieldProps = {
  label: string;
  /** Helper text, always associated with the control. */
  hint?: string | undefined;
  /** Hebrew validation message. Rendering it marks the control invalid. */
  error?: string | undefined;
  required?: boolean | undefined;
  className?: string | undefined;
  children: ReactNode;
};

export function Field({ label, hint, error, required = false, className, children }: FieldProps) {
  const controlId = useId();
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;

  const describedBy = cn(hint && hintId, error && errorId) || undefined;

  return (
    <FieldContext.Provider
      value={{ controlId, describedBy, invalid: Boolean(error), required }}
    >
      <div className={cn('flex flex-col gap-1.5', className)}>
        <label htmlFor={controlId} className="text-small font-semibold text-ink-900">
          {label}
          {required ? (
            <span className="text-brand-700" aria-hidden="true">
              {' *'}
            </span>
          ) : (
            /* The space is inside the accessible name on purpose: a margin is
               invisible to a screen reader, which would read "אימייל(רשות)". */
            <span className="font-normal text-ink-600">{' (רשות)'}</span>
          )}
        </label>

        {children}

        {hint ? (
          <p id={hintId} className="text-small text-ink-600">
            {hint}
          </p>
        ) : null}

        {/*
         * Always rendered, so the live region exists before anything is put
         * into it — a region created at the same moment as its content is
         * frequently missed. `aria-live` rather than `role="alert"`: a form has
         * one error region per field, and four assertive alerts would talk over
         * each other and over the form's own status line.
         */}
        <p aria-live="polite" id={errorId} className="text-small font-semibold text-brand-700">
          {error}
        </p>
      </div>
    </FieldContext.Provider>
  );
}

const controlClass =
  'w-full rounded-md border bg-stone-50 px-4 py-2.5 text-body text-ink-900 ' +
  'placeholder:text-ink-400 transition-colors duration-200';

function stateClass(invalid: boolean): string {
  return invalid ? 'border-brand-700 border-2' : 'border-stone-200 hover:border-ink-400';
}

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'className' | 'aria-invalid' | 'aria-describedby' | 'required'
> & { className?: string | undefined };

export function Input({ className, ...rest }: InputProps) {
  const { controlId, describedBy, invalid, required } = useFieldContext('Input');

  return (
    <input
      {...rest}
      id={controlId}
      required={required}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn(controlClass, stateClass(invalid), className)}
    />
  );
}

export type TextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'id' | 'className' | 'aria-invalid' | 'aria-describedby' | 'required'
> & { className?: string | undefined };

export function Textarea({ className, rows = 4, ...rest }: TextareaProps) {
  const { controlId, describedBy, invalid, required } = useFieldContext('Textarea');

  return (
    <textarea
      {...rest}
      rows={rows}
      id={controlId}
      required={required}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn(controlClass, stateClass(invalid), className)}
    />
  );
}

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'id' | 'className' | 'aria-invalid' | 'aria-describedby' | 'required'
> & { className?: string | undefined };

export function Select({ className, children, ...rest }: SelectProps) {
  const { controlId, describedBy, invalid, required } = useFieldContext('Select');

  return (
    <select
      {...rest}
      id={controlId}
      required={required}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn(controlClass, stateClass(invalid), className)}
    >
      {children}
    </select>
  );
}

/**
 * The `company` honeypot from docs/API_CONTRACT.md.
 *
 * Positioned off-screen rather than `display: none` — a bot that filters on
 * computed style skips hidden inputs — and taken out of the accessibility tree
 * and the tab order so a real person never meets it. The server answers a
 * populated `company` with `202` and discards the lead, because telling a bot it
 * was caught only helps it retry.
 *
 * This is why the build ships no third-party CAPTCHA: the legacy site loaded
 * reCAPTCHA on first paint, at a performance cost and with every visitor's data
 * sent to a third party.
 */
export function Honeypot({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();

  return (
    <div className="absolute -start-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
      <label htmlFor={id}>אל תמלאו שדה זה</label>
      <input
        id={id}
        name="company"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
