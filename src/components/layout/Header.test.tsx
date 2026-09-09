import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { Header } from './Header';
import { editorialNav, primaryNav } from './nav';

function renderHeader(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Header />
      <Routes>
        <Route path="/" element={<p>דף הבית</p>} />
        <Route path="/listings" element={<p>נכסים</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function toggle() {
  return screen.getByRole('button', { name: 'תפריט' });
}

describe('Header', () => {
  it('offers exactly the five condensed destinations, plus the two editorial ones', () => {
    renderHeader();

    const nav = screen.getByRole('navigation', { name: 'ניווט ראשי' });
    const labels = within(nav)
      .getAllByRole('link')
      .map((link) => link.textContent);

    expect(labels).toEqual(primaryNav.map((item) => item.label));
    expect(labels).toHaveLength(5);

    for (const item of editorialNav) {
      expect(screen.getByRole('link', { name: item.label })).toBeInTheDocument();
    }
  });

  it('marks the current page for assistive technology, not only with colour', () => {
    renderHeader('/listings');

    const nav = screen.getByRole('navigation', { name: 'ניווט ראשי' });
    const current = within(nav).getByRole('link', { name: 'נכסים' });

    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('exposes the phone number as a tel: link with the punctuation stripped', () => {
    renderHeader();

    const phone = screen.getByRole('link', { name: /טלפון/ });
    expect(phone.getAttribute('href')).toMatch(/^tel:[\d+]+$/);
  });
});

describe('mobile menu', () => {
  beforeEach(() => {
    renderHeader();
  });

  it('starts closed, with no menu links in the tab order or the accessibility tree', () => {
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not point aria-controls at a panel that has not been rendered', () => {
    expect(toggle()).not.toHaveAttribute('aria-controls');
  });

  it('opens as a modal dialog and points aria-controls at it', async () => {
    await userEvent.click(toggle());

    const dialog = screen.getByRole('dialog', { name: 'תפריט ראשי' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    expect(toggle()).toHaveAttribute('aria-controls', dialog.id);
  });

  it('moves focus into the panel on open', async () => {
    await userEvent.click(toggle());

    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('traps Tab at the end of the panel and wraps to the start', async () => {
    await userEvent.click(toggle());

    const dialog = screen.getByRole('dialog');
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    expect(first).toBeDefined();
    expect(last).toBeDefined();

    last?.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(first);
  });

  it('traps Shift+Tab at the start of the panel and wraps to the end', async () => {
    await userEvent.click(toggle());

    const dialog = screen.getByRole('dialog');
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(last);
  });

  it('closes on Escape and returns focus to the toggle that opened it', async () => {
    await userEvent.click(toggle());
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(toggle()).toHaveFocus();
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes from the panel close button and restores focus', async () => {
    await userEvent.click(toggle());
    await userEvent.click(screen.getByRole('button', { name: 'סגירת התפריט' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(toggle()).toHaveFocus();
  });

  it('closes when a destination is chosen, so the panel does not sit over the new page', async () => {
    await userEvent.click(toggle());

    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('link', { name: /^נכסים/ }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('locks the page behind it from scrolling, and unlocks on close', async () => {
    await userEvent.click(toggle());
    expect(document.body.style.overflow).toBe('hidden');

    await userEvent.keyboard('{Escape}');
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('is fully operable from the keyboard, without a pointer', async () => {
    toggle().focus();
    await userEvent.keyboard('{Enter}');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
