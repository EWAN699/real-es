import { existsSync } from 'node:fs';

import { redirectRules } from '../../src/lib/redirects';

/**
 * Assert every redirect destination corresponds to a page that was actually
 * built.
 *
 * `redirects.test.ts` checks destinations against SITE_ROUTES, which is a
 * declaration. That is a weaker guarantee than it looks: five destinations
 * were declared there and never built, so six legacy URLs redirected straight
 * into a 404 while the suite stayed green. Only the post-build filesystem
 * knows the truth, so the check belongs here.
 *
 * Throws rather than warns. A redirect map is the one artefact whose whole
 * purpose is to not lose traffic; shipping it half-broken is worse than
 * failing the deploy.
 */
export function verifyDestinations(distDir = 'dist'): void {
  const rules = redirectRules();
  const missing = new Set<string>();

  for (const { destination } of rules) {
    const path = destination.split('#')[0]!.split('?')[0]!.replace(/\/$/, '');
    const candidates = [
      `${distDir}${path}.html`,
      `${distDir}${path}/index.html`,
      path === '' ? `${distDir}/index.html` : '',
    ].filter(Boolean);

    if (!candidates.some((candidate) => existsSync(candidate))) missing.add(destination);
  }

  if (missing.size > 0) {
    throw new Error(
      `${missing.size} redirect destination(s) have no built page, so these legacy URLs ` +
        `would 404:\n  ${[...missing].join('\n  ')}`,
    );
  }

  console.log(`redirects: all ${rules.length} destinations resolve to a built page`);
}
