import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Run axe-core over the page and fail on any violation.
 *
 * The legacy site used an accessibility overlay widget. Overlays do not deliver
 * compliance — they sit on top of the same inaccessible markup — so this build
 * gates on the real thing instead. Zero violations, not "no serious ones".
 *
 * axe catches roughly a third of WCAG failures; it is a floor, not the ceiling.
 * The keyboard and RTL specs cover what it cannot see.
 */
export async function expectNoAxeViolations(page: Page, context?: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.map((node) => node.target.join(' ')),
  }));

  expect(summary, `axe violations${context ? ` (${context})` : ''}`).toEqual([]);
}
