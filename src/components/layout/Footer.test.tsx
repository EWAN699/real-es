import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { contact } from '@/content/contact';
import { Footer } from './Footer';
import { legalNav } from './nav';
import { WhatsAppCta } from './WhatsAppCta';

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );
}

describe('Footer', () => {
  it('is a contentinfo landmark', () => {
    renderFooter();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('marks the phone numbers up as dialable links', () => {
    renderFooter();

    const numbers = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href') ?? '')
      .filter((href) => href.startsWith('tel:'));

    expect(numbers.length).toBeGreaterThanOrEqual(2);
    for (const href of numbers) {
      // Separators break the dialler on some Android builds.
      expect(href).toMatch(/^tel:[\d+]+$/);
    }
  });

  it('links the email as mailto and WhatsApp as wa.me, with no third-party widget', () => {
    const { container } = renderFooter();

    expect(screen.getByRole('link', { name: contact.email })).toHaveAttribute(
      'href',
      `mailto:${contact.email}`,
    );
    expect(screen.getByRole('link', { name: 'וואטסאפ' }).getAttribute('href')).toMatch(
      /^https:\/\/wa\.me\/\d+$/,
    );
    expect(container.querySelectorAll('script, iframe')).toHaveLength(0);
  });

  it('publishes the accessibility statement and privacy policy', () => {
    renderFooter();

    for (const item of legalNav) {
      expect(screen.getByRole('link', { name: item.label })).toHaveAttribute('href', item.to);
    }
  });

  it('names each footer navigation region so the landmark list is meaningful', () => {
    renderFooter();

    const navs = screen.getAllByRole('navigation');
    expect(navs.length).toBeGreaterThan(0);
    for (const nav of navs) {
      expect(nav).toHaveAccessibleName();
    }
  });

  it('uses brand-300 for brand colour on the dark ground, never brand-700', () => {
    const { container } = renderFooter();
    const html = container.innerHTML;

    expect(html).toContain('brand-300');
    expect(html).not.toContain('text-brand-700');
  });
});

describe('WhatsAppCta', () => {
  it('is a plain link with no third-party script', () => {
    const { container } = render(<WhatsAppCta />);

    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    expect(container.querySelectorAll('script, iframe')).toHaveLength(0);
  });

  it('announces that it opens in a new window', () => {
    render(<WhatsAppCta />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(link).toHaveAccessibleName(/נפתח בחלון חדש/);
  });

  it('carries exactly one copy of its label, so the name is not read twice', () => {
    render(<WhatsAppCta />);

    const link = screen.getByRole('link');
    expect(within(link).getAllByText('דברו איתנו בוואטסאפ')).toHaveLength(1);
  });
});
