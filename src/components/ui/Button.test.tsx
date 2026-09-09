import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

function renderInRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Button', () => {
  it('renders a real button element by default, typed as "button"', async () => {
    const onClick = vi.fn();
    renderInRouter(<Button onClick={onClick}>שליחה</Button>);

    const button = screen.getByRole('button', { name: 'שליחה' });
    // A form-adjacent button that defaults to type="submit" submits by accident.
    expect(button).toHaveAttribute('type', 'button');

    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders an in-app link when given "to"', () => {
    renderInRouter(<Button to="/contact">דברו איתנו</Button>);

    expect(screen.getByRole('link', { name: 'דברו איתנו' })).toHaveAttribute('href', '/contact');
  });

  it('renders a plain anchor when given "href"', () => {
    renderInRouter(
      <Button href="https://wa.me/972500000000" rel="noreferrer">
        וואטסאפ
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'וואטסאפ' });
    expect(link).toHaveAttribute('href', 'https://wa.me/972500000000');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('is keyboard operable', async () => {
    const onClick = vi.fn();
    renderInRouter(<Button onClick={onClick}>שליחה</Button>);

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'שליחה' })).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalled();
  });

  it.each(['primary', 'secondary', 'ghost', 'onDark'] as const)(
    'never uses brand-500 as a text colour in the %s variant',
    (variant) => {
      const { container } = renderInRouter(<Button variant={variant}>טקסט</Button>);
      const className = container.firstElementChild?.getAttribute('class') ?? '';

      expect(className).not.toContain('text-brand-500');
    },
  );

  it('pairs the brand-500 fill with ink-900 text on dark grounds', () => {
    const { container } = renderInRouter(<Button variant="onDark">טקסט</Button>);
    const className = container.firstElementChild?.getAttribute('class') ?? '';

    expect(className).toContain('bg-brand-500');
    expect(className).toContain('text-ink-900');
  });
});
