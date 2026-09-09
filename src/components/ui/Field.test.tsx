import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Field, Honeypot, Input, Textarea } from './Field';

describe('Field', () => {
  it('associates the label with the control without the caller wiring ids', () => {
    render(
      <Field label="שם מלא" required>
        <Input name="name" />
      </Field>,
    );

    const input = screen.getByLabelText(/שם מלא/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('name', 'name');
  });

  it('chains hint and error into aria-describedby', () => {
    render(
      <Field label="טלפון" hint="לדוגמה: 052-1234567" error="מספר הטלפון אינו תקין.">
        <Input name="phone" />
      </Field>,
    );

    const input = screen.getByLabelText(/טלפון/);
    const describedBy = input.getAttribute('aria-describedby')?.split(' ') ?? [];

    expect(describedBy).toHaveLength(2);

    const described = describedBy.map((id) => document.getElementById(id)?.textContent);
    expect(described).toContain('לדוגמה: 052-1234567');
    expect(described).toContain('מספר הטלפון אינו תקין.');
  });

  it('marks the control invalid only while an error is present', () => {
    const { rerender } = render(
      <Field label="טלפון">
        <Input name="phone" />
      </Field>,
    );

    expect(screen.getByLabelText(/טלפון/)).not.toHaveAttribute('aria-invalid');

    rerender(
      <Field label="טלפון" error="שדה חובה">
        <Input name="phone" />
      </Field>,
    );

    expect(screen.getByLabelText(/טלפון/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('announces the error through a live region', () => {
    render(
      <Field label="טלפון" error="שדה חובה">
        <Input name="phone" />
      </Field>,
    );

    const message = screen.getByText('שדה חובה');
    expect(message).toHaveAttribute('aria-live', 'polite');
  });

  it('labels optional fields so the requirement is never guessed from an asterisk alone', () => {
    render(
      <Field label="אימייל">
        <Input name="email" />
      </Field>,
    );

    expect(screen.getByLabelText(/אימייל \(רשות\)/)).toBeInTheDocument();
  });

  it('works for a textarea too', () => {
    render(
      <Field label="הודעה">
        <Textarea name="message" />
      </Field>,
    );

    expect(screen.getByLabelText(/הודעה/).tagName).toBe('TEXTAREA');
  });

  it('throws a useful error when a control is used outside a Field', () => {
    // React logs the thrown error; the assertion is on the message itself.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Input name="orphan" />)).toThrow(/must be rendered inside a <Field>/);
    spy.mockRestore();
  });
});

describe('Honeypot', () => {
  it('is hidden from assistive technology and from the tab order', () => {
    const { container } = render(<Honeypot value="" onChange={() => {}} />);

    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');

    const input = container.querySelector('input[name="company"]');
    expect(input).not.toBeNull();
    expect(input).toHaveAttribute('tabindex', '-1');
    expect(input).toHaveAttribute('autocomplete', 'off');
  });

  it('stays off-screen rather than display:none, which a bot can filter on', () => {
    const { container } = render(<Honeypot value="" onChange={() => {}} />);
    const className = container.firstElementChild?.getAttribute('class') ?? '';

    expect(className).toContain('absolute');
    expect(className.split(' ')).not.toContain('hidden');
  });
});
